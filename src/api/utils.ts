import { LCDClient, RawKey } from "@terra-money/terra.js";
import { sleep } from "../lib/utils";

const localTerraHostName = process.env.LOCALTERRA_HOSTNAME ?? "localhost";

export async function createLocalTerraClient(timeoutInMs: number = 15_000, backoffInMs: number = 1_000): Promise<LCDClient>{
    let waitTime = 0;
    while(waitTime <= timeoutInMs){
        const startTime = new Date().getTime();
        try{
            const terra =  new LCDClient({
                URL: `http://${localTerraHostName}:1317`,
                chainID: 'localterra',
            });
            await checkLCDClientConnectivity(terra);
            return terra;
        }
        catch(e){
            console.log("waiting for localTerra mining to start")
            await sleep(backoffInMs)
            waitTime += new Date().getTime() - startTime;
        }
    }

    throw new Error(`Failed to init: no connection to localTerra`)
}

async function checkLCDClientConnectivity(terra: LCDClient, timeoutInMs: number = 5_000, backoffInMs: number = 500){
    let waitTime = 0;
    // wait for block mining to begin
    const getBlockNumber = async () => (await terra.tendermint.blockInfo()).block.header.height;
    const initialBlockNumber = await getBlockNumber();
    let nextBlockNumber = initialBlockNumber;
    while(nextBlockNumber === initialBlockNumber){
        const startTime = new Date().getTime();
        nextBlockNumber = await getBlockNumber();

        await sleep(backoffInMs);
        waitTime += new Date().getTime() - startTime;

        if(waitTime >= timeoutInMs){
            throw new Error("Timeout exceeded")
        }
    }
}

export function toHexBytesArray(num: number): Uint8Array {
    let res = new Uint8Array(4);
    res[0] = num >> 24;
    res[1] = (num >> 16) % 0xff;
    res[2] = (num >> 8) % 0xff;
    res[3] = num % 0xff;
    return res;
}

export function getPublicKey (rawKey: RawKey) : Uint8Array | null {
    if (rawKey.publicKey) {
        const publicKey = JSON.parse(rawKey.publicKey.toJSON()).key
        return Uint8Array.from(Buffer.from(publicKey, "base64")).subarray(1, 33)
    }
    return null
}