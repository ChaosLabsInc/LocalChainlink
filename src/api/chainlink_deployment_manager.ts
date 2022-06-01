import { LCDClient, MnemonicKey, Msg, MsgInstantiateContract, MsgStoreCode, Wallet } from "@terra-money/terra.js";
import { readFile } from 'fs/promises';
import { DEFAULT_SEED } from "./consts";
import { deployPriceFeed } from "./create_feed";
import { setPrice } from "./set_price";
import { IDeployedPriceFeed, IDeploymentManager, IPriceFeedConfig } from "./types";
import { createLocalTerraClient } from "./utils";

interface IChainlinkCodeIds{
    ocr2CodeId: number;
    accessControllerCodeId: number;
    cw20CodeId: number;
}

interface IContractAddresses {
    linkTokenAddress: string,
    billingControllerAddress: string,
    requesterControllerAddress: string,
}

export class ChainlinkDeploymentManager implements IDeploymentManager {
    private static instance: ChainlinkDeploymentManager;
    public terra: LCDClient;
    public signer: Wallet;
    public signerAddress: string
    public codeIds: IChainlinkCodeIds | undefined;
    public contractAddresses: IContractAddresses | undefined;
    public priceFeeds: IDeployedPriceFeed[] = [];

    constructor(terra: LCDClient){
        this.terra = terra;
        const mnemonicKey = new MnemonicKey({
            mnemonic: DEFAULT_SEED,
        });
        this.signer = terra.wallet(mnemonicKey);
        this.signerAddress = this.signer.key.accAddress;
    }

    public static async Instance(): Promise<ChainlinkDeploymentManager> {
        if (!ChainlinkDeploymentManager.instance) {
            const terra = await createLocalTerraClient()
            ChainlinkDeploymentManager.instance = new ChainlinkDeploymentManager(terra);
        }
        return ChainlinkDeploymentManager.instance;
    }

    public getPriceFeed(base: string, quote: string): IDeployedPriceFeed[] {
        return this.priceFeeds.filter(feed => feed.base === base && feed.quote === quote);
    }

    public async uploadContracts(){
        console.log("Uploading contracts...")

        const [ocr2CodeId,accessControllerCodeId,cw20CodeId] = await Promise.all([
            await this.uploadContractTemplate("ocr2.wasm"),
            await this.uploadContractTemplate("access_controller.wasm"),
            await this.uploadContractTemplate("cw20_base.wasm")])

        this.codeIds = {
            ocr2CodeId,
            accessControllerCodeId,
            cw20CodeId
        }
    }  

    public async instantiateContracts(){
        if (this.codeIds === undefined) {
            await this.uploadContracts()
        }
        console.log("instantiating contracts...")
        const billingControllerAddress = await this.createAccessControllerContract(this.codeIds!.accessControllerCodeId)
        const requesterControllerAddress = await this.createAccessControllerContract(this.codeIds!.accessControllerCodeId)
        const linkTokenAddress = await this.createLinkTokenContract(this.codeIds!.cw20CodeId)

        this.contractAddresses = {
            linkTokenAddress,
            requesterControllerAddress,
            billingControllerAddress
        }
    }

    public async deployPriceFeed(priceFeedConfig:IPriceFeedConfig): Promise<IDeployedPriceFeed>{
        if (this.codeIds?.ocr2CodeId === undefined || this.contractAddresses === undefined){
            await this.instantiateContracts();
        }
        const feedAddress = await deployPriceFeed(this, priceFeedConfig,{
            ocr2CodeId: this.codeIds!.ocr2CodeId,
            ...this.contractAddresses!
        });

        const startingRound = 1;
        const price = this.calculatePriceToSet(priceFeedConfig.initialPrice, priceFeedConfig.decimals);
        await setPrice(this, feedAddress, price, startingRound);

        const feed:IDeployedPriceFeed = {base:priceFeedConfig.base, quote:priceFeedConfig.quote, 
            address: feedAddress, currentRound: startingRound, decimals: priceFeedConfig.decimals}
        this.priceFeeds.push(feed)
        return feed;
    }

    public async getLatestPrice(feedAddress: string): Promise<number> {
        const result: any = await this.terra.wasm.contractQuery(feedAddress, "latest_round_data");
        return result.answer;
    }
    
    public async setPrice(priceFeed: IDeployedPriceFeed, price: number){
        priceFeed.currentRound++;
        const priceToSet = this.calculatePriceToSet(price, priceFeed.decimals);
        await setPrice(this, priceFeed.address, priceToSet, priceFeed.currentRound)
    }

    public async broadcast(msg: Msg) {
        return await this.signer
            .createAndSignTx({
                msgs: [msg],
                memo: "Instantiating",
                sequence: await this.signer.sequence()
            })
            .then((tx) => this.terra.tx.broadcast(tx));
    }

    public async instantiateContract(codeId: number, initMsg: object): Promise<string> {
        try {
            const response = await this.broadcast(new MsgInstantiateContract(
                this.signerAddress,
                this.signerAddress,
                codeId,
                initMsg
            ))
            const address = JSON.parse(response.raw_log)[0].events.find((item: { type: string; }) => item.type == "instantiate_contract").attributes.find((attr: { key: string; }) => attr.key == "contract_address").value;
            return address
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    }
    
    private async uploadContractTemplate(contractName: string) {
        try {
            const wasm = await readFile(`./artifacts/${contractName}`);
            const response = await this.broadcast(new MsgStoreCode(this.signerAddress, wasm.toString("base64")))
            const code = JSON.parse(response.raw_log)[0].events.find((item: { type: string; }) => item.type == "store_code").attributes.find((attr: { key: string; }) => attr.key == "code_id").value;
            return code;
        } catch (error) {
            console.error(`Failed to load contract ${contractName}`, error);
            process.exit(1);
        }
    }

    private async createAccessControllerContract(code: number): Promise<string> {
        return await this.instantiateContract(code, {});
    }

    private async createLinkTokenContract(code: number): Promise<string> {
        return await this.instantiateContract(
            code,
            {
                "name": "Chainlink",
                "symbol": "LINK",
                "decimals": 18,
                "initial_balances": [
                    {
                        "address": this.signerAddress,
                        "amount": "1000000000000000000000000000",
                    }
                ],
                "marketing": {
                    "project": "Chainlink",
                    "logo": {
                        "url": "https://assets-global.website-files.com/5e8c4efdc725c62673645017/5e981c33430c9765dba5a098_Symbol%20White.svg"
                    }
                },
                "mint": {
                    "minter": this.signerAddress
                }
            }
        );
    }

    private calculatePriceToSet(price: number, decimals: number){
        return price * Math.pow(10, decimals)
    }
}