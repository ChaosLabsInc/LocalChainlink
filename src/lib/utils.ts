import { IPriceBase } from "./types";

export function getPriceFeedName(feed: IPriceBase){
    return `${feed.base}/${feed.quote}`
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}