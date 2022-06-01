import { MsgExecuteContract, RawKey } from "@terra-money/terra.js";
import { createHash, Hash } from "blake2";
import { randomBytes } from "crypto";
import { TRANSMITTER_ADDRESSES } from "./consts";
import { IDeploymentManager } from "./types";
import { getPublicKey, toHexBytesArray } from "./utils";

interface ConfigDetails {
    config_digest: string
    epoch: number
};

export async function setPrice(deploymentManager: IDeploymentManager, orc2Addr: string, price: bigint, round: number) {
    console.log("start transmit function")
    console.log("start get latest details")
    const configDetails = await getLatestConfigDetails(deploymentManager, orc2Addr)
    console.log("end get latest details")

    const report = createReport(price)
    const reportContext = createReportContext(configDetails.config_digest, round, configDetails.epoch)

    let hasher: Hash = createHash('blake2s')
    const buf = Buffer.alloc(4)
    buf.writeUint32BE(report.length);
    hasher.update(buf)
    hasher.update(Buffer.from(reportContext))
    hasher.update(Buffer.from(report))
    const hash = hasher.digest()

    let signatures: string[] = []
    for (const keypair of Array.from({ length: 2 }, () => new RawKey(randomBytes(32)))) {
        let signature = new Uint8Array(96)
        let publicKey = getPublicKey(keypair)
        signature.set(publicKey ? publicKey : new Uint8Array(32), 0)

        let signt = await keypair.sign(hash)
        signature.set(signt, 32) // 64 bytes
        signatures = signatures.concat(Buffer.from(signature).toString("base64"))
    }

    console.log("start transmit call")
    await deploymentManager.broadcast(new MsgExecuteContract(
        TRANSMITTER_ADDRESSES[0], orc2Addr, {
        "transmit": {
            "report_context": Buffer.from(reportContext).toString("base64"),
            "report": Buffer.from(report).toString("base64"),
            "signatures": signatures
        }
    }));
    console.log("end transmit")
}

async function getLatestConfigDetails(deploymentManager: IDeploymentManager, orc2Addr: string): Promise<ConfigDetails> {
    const response = await deploymentManager.terra.wasm.contractQuery(orc2Addr, "latest_config_digest_and_epoch")
    return response as ConfigDetails;
}

function createReportContext(config_digest: string, round: number, epoch: number): Uint8Array {
    // Report context is a 96 bytes wrapper.
    // 32 bytes: the latest config digest of the contract. This is a step in verification.
    // 27 bytes of 0
    // 4 bytes of the epoch number. Epoch is a subtime of round. We can submit different configurations for the same round.
    // 1 byte is the round number. 
    let reportContext = new Uint8Array(Array.from({ length: 96 }, () => 0))
    let index = 0
    reportContext.set(Uint8Array.from(Buffer.from(config_digest, 'hex')), index)
    index += 32

    reportContext.set(Uint8Array.from(Buffer.from(epoch.toString(), 'hex')), index + 27)
    index += 27 + 4
    reportContext.set(Uint8Array.from([round]), index)
    return reportContext
}

function createReport(price: bigint): Uint8Array {
    // output in the array
    // 97, 91, 43, 83 (timestamp)
    // 0, 1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 (32 bytes)
    // 4 (length)
    // 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 73, 150, 2, 210 (observation)
    // 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 73, 150, 2, 210 (observation)
    // 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 73, 150, 2, 210 (observation)
    // 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 73, 150, 2, 210 (observation)
    // 0, 0, 0, 0, 0, 0, 0, 0, 13, 224, 182, 179, 167, 100, 0, 0 (juels per luna (1 with 18 decimal places)

    const length: number = 4
    const observationLength = 16

    let report = new Uint8Array(length + 32 + 1 + length * observationLength + observationLength)

    let index = 0
    report.set(toHexBytesArray(Math.floor(Date.now() / 1000)), index) //ok
    index += 4
    report.set(Array.from({ length: length }, (_, i) => i), index)
    index += length
    report.set(Array.from({ length: 28 }, () => 0), index)
    index += 28
    report.set([length], index)
    index += 1
    for (let i = 0; i < length; i++) {
        const buf = Buffer.alloc(observationLength);
        // buffer writes the number at the beginning of the allocation. We want it to be at the end like in Rust.
        buf.writeBigUInt64BE(price, 8)
        report.set(buf, index)
        index += 16
    }
    report.set([0, 0, 0, 0, 0, 0, 0, 0, 13, 224, 182, 179, 167, 100, 0, 0], index)
    return report
}
