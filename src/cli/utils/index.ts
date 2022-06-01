import Table from "cli-table";
import chalk from "chalk";

export = {
  logTable: function logTable(headers: string[], data: string[][]) {
    let table = new Table({
      head: headers,
      colWidths: [15, 15, 50],
    });
    table.push(...data);
    console.log(table.toString());
  },
  logBlue: function logBlue(data: string) {
    console.log(chalk.blue(data));
  },
  logGreen: function logGreen(data: string) {
    console.log(chalk.green(data));
  },
  logYellow: function logYellow(data: string) {
    console.log(chalk.yellow(data));
  },
  parseFeedName: function parseFeedName(feedName: string): {base: string, quote: string}{
    const split = feedName.split("/");
    return { base: split[0], quote:split[1] }
  }
};
