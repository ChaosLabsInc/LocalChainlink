import { Cli } from ".";

const CLI_TEST_SUITE = "CLI_TEST_SUITE ";


test(`${CLI_TEST_SUITE} - welcomeMessage`, async () => {
  // should not return value
  const cli = new Cli({} as any);
  expect(await cli.welcomeMessage()).toBe(undefined);
});

test(`${CLI_TEST_SUITE} - getPriceFeeds`, async () => {
const obj = {
    getPriceFeeds: () => { return Promise.resolve([
        {
            "base": "ATOM",
            "quote": "USD",
            "address": "terra1x4vt5xndndzq664rxtqrrqu9py9qndp3nw95lu"
        },
        {
            "base": "LUNA",
            "quote": "USD",
            "address": "terra1vuwvsen7ulnsswwha5xm05ny86952ujs8jfm0u"
        }
        ])}
    }
    const cli = new Cli(obj as any);
    const { priceFeeds, inquirerChoices } = await cli.getPriceFeeds();
    expect(Array.isArray(priceFeeds)).toBeTruthy();
    expect(priceFeeds).toHaveLength(2);
    expect(Array.isArray(inquirerChoices)).toBeTruthy();
    expect(inquirerChoices).toHaveLength(2);
});