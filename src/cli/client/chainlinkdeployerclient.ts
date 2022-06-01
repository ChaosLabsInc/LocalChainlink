import axios from "axios";
import Spinnies from "spinnies"
import { sleep } from "../../lib/utils";
import { IPriceFeed } from "../../lib/types";

export class ChainlinkDeployerClient {
    private static BASE_URL = "http://localhost:3010"
    private static instance: ChainlinkDeployerClient;

    private constructor() { 
    }

    public static async Instance(): Promise<ChainlinkDeployerClient> {
        if (!ChainlinkDeployerClient.instance) {
            await this.checkConnectivity();
            ChainlinkDeployerClient.instance = new ChainlinkDeployerClient();
        }
        return ChainlinkDeployerClient.instance;
    }

    public async getPriceFeeds(): Promise<IPriceFeed[]>{
        const result = await axios.get(ChainlinkDeployerClient.BASE_URL + "/feeds", {timeout: 15_000});
        return result.data;
    }

    public async getPrice(base: string, quote: string): Promise<number>{
        const result = await axios.get(ChainlinkDeployerClient.BASE_URL + "/price", 
        {
            timeout: 15_000,
            params: {
                base,
                quote
            }
        });        
        return result.data; 
    }

    public async setPrice(base: string, quote: string, price: number): Promise<void>{
        await axios.post(ChainlinkDeployerClient.BASE_URL + "/price", 
        {
            base,
            quote,
            price
        },
        { timeout: 15_000 });
        return;
    }

    public async createFeed(base: string, quote: string, initialPrice: number): Promise<IPriceFeed>{
        const res = await axios.put(ChainlinkDeployerClient.BASE_URL + "/feed", 
            {
                base,
                quote,
                initialPrice
            },{ timeout: 90_000 });
        return res.data;
    }

    private static async checkConnectivity(timeoutInMs: number = 3*60_000, backoffInMs: number = 1_000){
        let waitTime = 0;
        let spinner:Spinnies|undefined = undefined;
        while(waitTime <= timeoutInMs){
            const startTime = new Date().getTime();
            try {
                await axios.get(ChainlinkDeployerClient.BASE_URL + "/health")
                spinner?.remove('spinner-1');
                return;
            }
            catch(e){
                if (spinner === undefined){
                    spinner = new Spinnies();
                    spinner.add('spinner-1', { text: 'Waiting for chainlink-deployer to start...' });
                }
                await sleep(backoffInMs)                
                waitTime += new Date().getTime() - startTime;
            }
        }
        throw new Error(`Failed to init: no connection to localChainlink`)
    }
  } 