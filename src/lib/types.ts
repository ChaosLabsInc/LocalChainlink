
export interface IPriceBase {
    base: string;
    quote: string;
}
export interface IPriceFeed extends IPriceBase{
    address: string;
}
