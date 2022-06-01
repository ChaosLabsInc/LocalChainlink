import { MsgExecuteContract, RawKey } from "@terra-money/terra.js";
import { PAYEE_ADDRESSES, TRANSMITTER_ADDRESSES } from './consts'
import { randomBytes } from "crypto";
import { IDeploymentManager, IPriceFeedConfig } from "./types";
import { getPublicKey } from "./utils";
import { getPriceFeedName } from "../lib/utils";

interface IOcr20DeploymentConfig{
    ocr2CodeId: number;
    linkTokenAddress: string,
    billingControllerAddress: string,
    requesterControllerAddress: string,
}

export async function deployPriceFeed(deploymentManager: IDeploymentManager, feedConfig: IPriceFeedConfig, deploymentConfig: IOcr20DeploymentConfig): Promise<string>{
    console.log(`Deploying ${getPriceFeedName(feedConfig)} price feed`)

    const ocrAddr = await createOcrContract(deploymentManager,feedConfig, deploymentConfig);

    const proposalId = await beginProposal(deploymentManager, ocrAddr)

    await proposeConfig(deploymentManager, ocrAddr, proposalId)

    await proposeOffChainConfig(deploymentManager, ocrAddr, proposalId)

    const proposalDigest = await finalizeProposal(deploymentManager, ocrAddr, proposalId)

    await acceptProposal(deploymentManager, ocrAddr, proposalId, proposalDigest)

    await setBilling(deploymentManager, ocrAddr)

    return ocrAddr;
}

async function createOcrContract(deploymentManager: IDeploymentManager, feedConfig: IPriceFeedConfig, deploymentConfig: IOcr20DeploymentConfig): Promise<string> {
    return await deploymentManager.instantiateContract(
        deploymentConfig.ocr2CodeId, {
        "link_token": deploymentConfig.linkTokenAddress,
        "min_answer": "0",
        "max_answer": (10_000_000_000_000_000).toString(),
        "billing_access_controller": deploymentConfig.billingControllerAddress,
        "requester_access_controller": deploymentConfig.requesterControllerAddress,
        "decimals": feedConfig.decimals,
        "description": getPriceFeedName(feedConfig),
    });
}

async function beginProposal(deploymentManager: IDeploymentManager, orc2addr: string): Promise<string> {
    const response = await deploymentManager.broadcast(new MsgExecuteContract(
        deploymentManager.signer.key.accAddress, orc2addr, "begin_proposal")
    )
    const proposalId = JSON.parse(response.raw_log)[0].events.find((item: { type: string; }) => item.type == "wasm").attributes.find((attr: { key: string; }) => attr.key == "proposal_id").value;
    return proposalId;
}

async function proposeConfig(deploymentManager: IDeploymentManager, orc2addr: string, proposalId: string): Promise<void> {
    console.log("start propose config")
    const keypairs: RawKey[] = Array.from({ length: 4 }, () => new RawKey(randomBytes(32)))

    const signers = Array.from(keypairs, (keypair, _) => getPublicKeyWrapped(keypair))
    const transimtters = Array.from({ length: keypairs.length }, (_, i) => TRANSMITTER_ADDRESSES[i])
    const payee = Array.from({ length: keypairs.length }, (_, i) => PAYEE_ADDRESSES[i])

    await deploymentManager.broadcast(new MsgExecuteContract(
        deploymentManager.signerAddress, orc2addr, {
        "propose_config": {
            f: 1,
            id: proposalId,
            onchain_config: [].toString(),
            payees: payee,
            signers: signers,
            transmitters: transimtters
        }
    }))
    console.log("end propose config")
}

async function proposeOffChainConfig(deploymentManager: IDeploymentManager, orc2addr: string, proposalId: string): Promise<void> {
    console.log("start propose_offchain_config")
    await deploymentManager.broadcast(new MsgExecuteContract(
        deploymentManager.signerAddress, orc2addr, {
        "propose_offchain_config": {
            id: proposalId,
            offchain_config_version: 1,
            offchain_config: Buffer.from(Array.from({ length: 3 }, (_, i) => i)).toString('base64')
        }
    }))
    console.log("end propose_offchain_config")
}

async function finalizeProposal(deploymentManager: IDeploymentManager, orc2Addr: string, proposalId: string): Promise<string> {
    console.log("start finalize_proposal")
    const response = await deploymentManager.broadcast(new MsgExecuteContract(
        deploymentManager.signerAddress, orc2Addr, {
        "finalize_proposal": {
            id: proposalId,
        }
    }))
    const proposalDigest = JSON.parse(response.raw_log)[0].events.find((item: { type: string; }) => item.type == "wasm").attributes.find((attr: { key: string; }) => attr.key == "digest").value
    console.log("end finalize_proposal")
    return proposalDigest
}

async function acceptProposal(deploymentManager: IDeploymentManager, orc2Addr: string, proposalId: string, proposalDigest: string) {
    console.log("start accept_proposal")
    await deploymentManager.broadcast(new MsgExecuteContract(
        deploymentManager.signerAddress, orc2Addr, {
        "accept_proposal": {
            id: proposalId,
            digest: Buffer.from(Uint8Array.from(Buffer.from(proposalDigest, 'hex'))).toString("base64")
        }
    }));
    console.log("end accept_proposal")
}

async function setBilling(deploymentManager: IDeploymentManager, orc2Addr: string) {
    console.log("start set billing")
    // juels is the energy cost per each coin. This is multiply by the gas price in the total calculation of the cost. 
    // the numbers below should be configured by the user (how much he wants to charge) in the CLI. I put for now 0 and 0
    await deploymentManager.broadcast(new MsgExecuteContract(
        deploymentManager.signerAddress, orc2Addr, {
        "set_billing": {
            "config": {
                transmission_payment_gjuels: 0,
                observation_payment_gjuels: 0,
                recommended_gas_price_micro: "0.0".toString()
            }
        }
    }));
    console.log("finish set billing")
}

const getPublicKeyWrapped = (rawKey: RawKey): string => {
    const publicKey = getPublicKey(rawKey)
    return publicKey ? Buffer.from(publicKey).toString('base64') : Buffer.from([]).toString()
}


