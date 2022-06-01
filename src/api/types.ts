import { BlockTxBroadcastResult, LCDClient, Msg, Wallet } from "@terra-money/terra.js";
import { IPriceBase } from "../lib/types";
export interface IDeployedPriceFeed extends Omit<IPriceFeedConfig, 'initialPrice'> {
    address: string
    currentRound: number
}

export interface IPriceFeedConfig extends IPriceBase{
    initialPrice: number
    decimals: number
}

export interface IDeploymentManager{
    terra: LCDClient;
    signer: Wallet;
    signerAddress: string
    instantiateContract(codeId: number, initMsg: object): Promise<string>
    broadcast(msg: Msg): Promise<BlockTxBroadcastResult>
}