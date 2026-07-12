import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const RPC_URL =
	process.env.RPC_URL || "https://rpc.testnet.chain.robinhood.com";

export default {
	solidity: {
		version: "0.8.26",
		settings: {
			evmVersion: "cancun",
			viaIR: true,
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	networks: {
		robinhoodTestnet: {
			url: RPC_URL,
			chainId: 46630,
			accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
		},
	},
};