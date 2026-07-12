import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ethers } from 'ethers';
import './styles.css';
import hookedLogo from '../public/logo.png';

const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 46630);
const RPC_URL =
	import.meta.env.VITE_RPC_URL || 'https://rpc.testnet.chain.robinhood.com';
const EXPLORER_URL =
	import.meta.env.VITE_EXPLORER_URL ||
	'https://explorer.testnet.chain.robinhood.com';

const LAUNCHPAD = import.meta.env.VITE_RECOM_LAUNCHPAD || '';

const DEFAULT_COLLECTION =
	import.meta.env.VITE_DEFAULT_COLLECTION ||
	'0xC71aBD280d36D973D1C15A060614C7453c1e72e2';

const DEFAULT_TOKEN =
	import.meta.env.VITE_DEFAULT_TOKEN ||
	'0x7343a78b3fd567f1CEB923Ed26697169c8f33Da9';

const DEFAULT_POOL =
	import.meta.env.VITE_DEFAULT_POOL ||
	'0xE51672ed1195B103C8fEA1f4829e0341ffF1ef6E';

const MAX_SUPPLY = Number(import.meta.env.VITE_MAX_SUPPLY || 100);

const LAUNCHPAD_ABI = [
	'event CollectionLaunched(address indexed creator,address indexed collection,string name,string tokenName)',
	'function launchCollection((string uri,string collectionName,string collectionSymbol,string tokenName,string tokenSymbol,uint256 startingMarketCapWei,uint256 baseMintPriceWei,uint256 priceStepWei,uint256 decayWindow,uint8 feeType) p) external payable returns(address collection)',
];

const NFT_ABI = [
	'event Minted(address indexed buyer,uint256 indexed tokenId,uint256 price)',
	'event Bonded(address indexed token,address indexed pool)',
	'function mint() external payable',
	'function currentMintPrice() view returns(uint256)',
	'function totalMinted() view returns(uint256)',
	'function bonded() view returns(bool)',
	'function token() view returns(address)',
	'function pool() view returns(address)',
];

const TOKEN_ABI = [
	'function lockVault() external',
	'function vaultLocked() view returns(bool)',
	'function deployedAt() view returns(uint256)',
];

function shortAddress(addr) {
	if (!addr) return '-';
	return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function explorerAddress(addr) {
	return `${EXPLORER_URL}/address/${addr}`;
}

function explorerTx(hash) {
	return `${EXPLORER_URL}/tx/${hash}`;
}

function isAddress(addr) {
	return ethers.isAddress(addr || '');
}

async function copyText(text, label = 'Address') {
	if (!text) return;

	try {
		await navigator.clipboard.writeText(text);
		alert(`${label} copied`);
	} catch {
		const textarea = document.createElement('textarea');
		textarea.value = text;
		document.body.appendChild(textarea);
		textarea.select();
		document.execCommand('copy');
		document.body.removeChild(textarea);
		alert(`${label} copied`);
	}
}

function CopyIcon() {
	return (
		<svg
			width="15"
			height="15"
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M8 8.5C8 7.12 9.12 6 10.5 6H18C19.38 6 20.5 7.12 20.5 8.5V16C20.5 17.38 19.38 18.5 18 18.5H10.5C9.12 18.5 8 17.38 8 16V8.5Z"
				stroke="currentColor"
				strokeWidth="2"
			/>
			<path
				d="M5.5 15.5H5C3.9 15.5 3 14.6 3 13.5V6C3 4.9 3.9 4 5 4H12.5C13.6 4 14.5 4.9 14.5 6V6.5"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function App() {
	const [account, setAccount] = useState('');
	const [chainOk, setChainOk] = useState(false);
	const [busy, setBusy] = useState(false);
	const [collection, setCollection] = useState(DEFAULT_COLLECTION);

	const [status, setStatus] = useState({
		type: 'known',
		collection: DEFAULT_COLLECTION,
		token: DEFAULT_TOKEN,
		pool: DEFAULT_POOL,
		total: null,
		price: null,
		bonded: true,
		vaultLocked: null,
		deployedAt: null,
	});

	const [epoch] = useState({
		currentEpoch: 1,
		airdropPool: 'Coming soon',
		burnTarget: 'Coming soon',
		claimable: 'Not active',
	});

	const [form, setForm] = useState({
		uri: '{{https://example.com/metadata/{id}}}.json',
		collectionName: 'HOOKED NFT',
		collectionSymbol: 'HOOKED',
		tokenName: 'HOOKED Token',
		tokenSymbol: 'HOOKED',
		startingMc: '10',
		baseMint: '0.001',
		priceStep: '0.0001',
		decayWindow: '3600',
		feeType: '0',
	});

	const valid =
		form.collectionName &&
		form.collectionSymbol &&
		form.tokenName &&
		form.tokenSymbol &&
		Number(form.baseMint) >= 0 &&
		Number(form.priceStep) >= 0;

	function update(key, value) {
		setForm((prev) => ({ ...prev, [key]: value }));
	}

	function getReadProvider() {
		if (window.ethereum) {
			return new ethers.BrowserProvider(window.ethereum);
		}

		return new ethers.JsonRpcProvider(RPC_URL);
	}

	async function prepare() {
		if (!window.ethereum) {
			throw new Error('Install MetaMask / EVM wallet dulu.');
		}

		const provider = new ethers.BrowserProvider(window.ethereum);
		const accounts = await provider.send('eth_requestAccounts', []);
		setAccount(accounts[0]);

		const net = await provider.getNetwork();

		if (Number(net.chainId) !== CHAIN_ID) {
			await window.ethereum.request({
				method: 'wallet_addEthereumChain',
				params: [
					{
						chainId: `0x${CHAIN_ID.toString(16)}`,
						chainName:
							CHAIN_ID === 46630
								? 'Robinhood Chain Testnet'
								: 'Robinhood Chain',
						nativeCurrency: {
							name: 'ETH',
							symbol: 'ETH',
							decimals: 18,
						},
						rpcUrls: [RPC_URL],
						blockExplorerUrls: [EXPLORER_URL],
					},
				],
			});
		}

		setChainOk(true);

		const freshProvider = new ethers.BrowserProvider(window.ethereum);
		return freshProvider.getSigner();
	}

	async function connect() {
		try {
			await prepare();
		} catch (error) {
			alert(error.shortMessage || error.message || 'Connect wallet gagal.');
		}
	}

	async function launchCollection() {
		setBusy(true);

		try {
			if (!LAUNCHPAD) {
				throw new Error('VITE_RECOM_LAUNCHPAD belum diisi.');
			}

			const signer = await prepare();
			const contract = new ethers.Contract(LAUNCHPAD, LAUNCHPAD_ABI, signer);

			const params = [
				form.uri,
				form.collectionName,
				form.collectionSymbol,
				form.tokenName,
				form.tokenSymbol,
				ethers.parseEther(form.startingMc || '0'),
				ethers.parseEther(form.baseMint || '0'),
				ethers.parseEther(form.priceStep || '0'),
				BigInt(form.decayWindow || 0),
				Number(form.feeType),
			];

			const tx = await contract.launchCollection(params, { value: 0 });
			const receipt = await tx.wait();

			const event = receipt.logs
				.map((log) => {
					try {
						return contract.interface.parseLog(log);
					} catch {
						return null;
					}
				})
				.find((parsed) => parsed && parsed.name === 'CollectionLaunched');

			const addr = event?.args?.collection || '';

			setCollection(addr);
			setStatus({
				type: 'launch',
				tx: receipt.hash,
				collection: addr,
				total: '0',
				price: form.baseMint,
				bonded: false,
				token: '',
				pool: '',
				vaultLocked: null,
				deployedAt: null,
			});

			if (addr) {
				await refreshCollection(addr);
			}
		} catch (error) {
			alert(error.shortMessage || error.message || 'Launch gagal.');
		} finally {
			setBusy(false);
		}
	}

	async function refreshCollection(addr = collection) {
		try {
			if (!addr) return;

			if (!isAddress(addr)) {
				throw new Error('Collection address tidak valid.');
			}

			const provider = getReadProvider();
			const nft = new ethers.Contract(addr, NFT_ABI, provider);

			const [total, price, bonded] = await Promise.all([
				nft.totalMinted(),
				nft.currentMintPrice(),
				nft.bonded(),
			]);

			let token = '';
			let pool = '';
			let vaultLocked = null;
			let deployedAt = null;

			if (bonded) {
				token = await nft.token();
				pool = await nft.pool();

				if (token && isAddress(token)) {
					const tokenContract = new ethers.Contract(token, TOKEN_ABI, provider);

					try {
						const [locked, tokenDeployedAt] = await Promise.all([
							tokenContract.vaultLocked(),
							tokenContract.deployedAt(),
						]);

						vaultLocked = locked;
						deployedAt = tokenDeployedAt.toString();
					} catch {
						vaultLocked = null;
						deployedAt = null;
					}
				}
			}

			setStatus((prev) => ({
				...prev,
				type: 'collection',
				collection: addr,
				total: total.toString(),
				price: ethers.formatEther(price),
				bonded,
				token,
				pool,
				vaultLocked,
				deployedAt,
			}));
		} catch (error) {
			alert(error.shortMessage || error.message || 'Load collection gagal.');
		}
	}

	async function mintNFT() {
		setBusy(true);

		try {
			if (!collection || !isAddress(collection)) {
				throw new Error('Collection address tidak valid.');
			}

			const signer = await prepare();
			const nft = new ethers.Contract(collection, NFT_ABI, signer);
			const price = await nft.currentMintPrice();

			const tx = await nft.mint({ value: price });
			await tx.wait();

			await refreshCollection(collection);
		} catch (error) {
			alert(error.shortMessage || error.message || 'Mint gagal.');
		} finally {
			setBusy(false);
		}
	}

	async function lockVault() {
		setBusy(true);

		try {
			const tokenAddr = status?.token;

			if (!tokenAddr || !isAddress(tokenAddr)) {
				throw new Error('Token belum tersedia. Mint sampai bonded dulu.');
			}

			const signer = await prepare();
			const tokenContract = new ethers.Contract(tokenAddr, TOKEN_ABI, signer);

			const tx = await tokenContract.lockVault();
			await tx.wait();

			await refreshCollection(collection);

			alert('Vault locked.');
		} catch (error) {
			alert(error.shortMessage || error.message || 'Lock vault gagal.');
		} finally {
			setBusy(false);
		}
	}

	function mockClaimAirdrop() {
		alert('Epoch airdrop belum aktif. Nanti sambungkan ke contract epoch.');
	}

	function mockBurnToken() {
		alert('Epoch burn belum aktif. Nanti sambungkan ke contract burn.');
	}

	return (
		<div className="app">
			<header className="topbar">
				<div className="brand">
					<img src={hookedLogo} alt="HOOKED logo" />
					<div>
						<b>HOOKED</b>
						<small>OriginPad-style NFT bonding launchpad</small>
					</div>
				</div>

				<div className="top-actions">
					<span className={chainOk ? 'network ok' : 'network'}>
						{chainOk ? 'Network ready' : `Chain ${CHAIN_ID}`}
					</span>

					<button onClick={connect}>
						{account ? shortAddress(account) : 'Connect wallet'}
					</button>
				</div>
			</header>

			<main>
				<section className="hero">
					<div className="hero-copy">
						<p className="pill">HOOKED • Robinhood Chain Testnet</p>
						<h1>NFT first. Token bonded at final mint.</h1>
						<p>
							Launch collection, mint NFT through bonding curve, auto deploy
							token, create seed pool, lock vault, then continue to epoch
							airdrop and burn.
						</p>

						<div className="hero-stats">
							<Stat label="Chain ID" value={CHAIN_ID} />
							<Stat label="Max supply" value={MAX_SUPPLY} />
							<Stat
								label="Launchpad"
								value={LAUNCHPAD ? shortAddress(LAUNCHPAD) : 'Not set'}
							/>
						</div>
					</div>

					<div className="panel">
						<div className="panel-head">
							<div>
								<h2>Launch Collection</h2>
								<p>Create HOOKED-style NFT bonding collection.</p>
							</div>
						</div>

						<div className="grid">
							<Field
								label="Collection name"
								value={form.collectionName}
								onChange={(v) => update('collectionName', v)}
							/>
							<Field
								label="Collection symbol"
								value={form.collectionSymbol}
								onChange={(v) => update('collectionSymbol', v)}
							/>
							<Field
								label="Token name"
								value={form.tokenName}
								onChange={(v) => update('tokenName', v)}
							/>
							<Field
								label="Token symbol"
								value={form.tokenSymbol}
								onChange={(v) => update('tokenSymbol', v)}
							/>
							<Field
								label="Starting MC (ETH)"
								value={form.startingMc}
								onChange={(v) => update('startingMc', v)}
							/>
							<Field
								label="Base mint (ETH)"
								value={form.baseMint}
								onChange={(v) => update('baseMint', v)}
							/>
							<Field
								label="Price step (ETH)"
								value={form.priceStep}
								onChange={(v) => update('priceStep', v)}
							/>
							<Field
								label="Decay window (sec)"
								value={form.decayWindow}
								onChange={(v) => update('decayWindow', v)}
							/>

							<label>
								Fee type
								<select
									value={form.feeType}
									onChange={(event) => update('feeType', event.target.value)}
								>
									<option value="0">ETH</option>
									<option value="1">Token buyback</option>
									<option value="2">Both</option>
								</select>
							</label>

							<label className="wide">
								Metadata URI
								<input
									value={form.uri}
									onChange={(event) => update('uri', event.target.value)}
								/>
							</label>
						</div>

						<button
							className="primary"
							disabled={!valid || busy}
							onClick={launchCollection}
						>
							{busy ? 'Working...' : 'Launch Collection'}
						</button>
					</div>
				</section>

				<section className="dashboard">
					<div className="manage card">
						<div className="section-head">
							<div>
								<h2>Collection Control</h2>
								<p>Load collection, mint NFT, and trigger vault lock.</p>
							</div>
						</div>

						<div className="row">
							<input
								placeholder="Collection address"
								value={collection}
								onChange={(event) => setCollection(event.target.value)}
							/>

							<button
								disabled={!collection || busy}
								onClick={() => refreshCollection()}
							>
								Load
							</button>

							<button disabled={!collection || busy} onClick={mintNFT}>
								Mint NFT
							</button>
						</div>

						{status && <StatusCard status={status} onLock={lockVault} />}
					</div>

					<div className="epoch card">
						<div className="section-head">
							<div>
								<h2>Epoch Airdrop / Burn</h2>
								<p>Placeholder panel for next contract module.</p>
							</div>
							<span className="badge">Next</span>
						</div>

						<div className="epoch-grid">
							<Stat label="Current epoch" value={epoch.currentEpoch} />
							<Stat label="Airdrop pool" value={epoch.airdropPool} />
							<Stat label="Burn target" value={epoch.burnTarget} />
							<Stat label="Claimable" value={epoch.claimable} />
						</div>

						<div className="row">
							<button onClick={mockClaimAirdrop}>Claim Airdrop</button>
							<button onClick={mockBurnToken}>Burn Token</button>
						</div>
					</div>
				</section>

				<section className="steps">
					<Step done title="1 Launch NFT" text="Collection created." />
					<Step
						done={Number(status?.total || 0) > 0}
						title={`2 Mint to ${MAX_SUPPLY}`}
						text="Mint through bonding curve."
					/>
					<Step
						done={Boolean(status?.bonded)}
						title="3 Auto Token"
						text="Token deployed after final mint."
					/>
					<Step
						done={Boolean(status?.vaultLocked)}
						title="4 Lock Vault"
						text="Vault lock activated."
					/>
					<Step title="5 Epoch" text="Airdrop and burn module." />
				</section>
			</main>
		</div>
	);
}

function Field({ label, value, onChange }) {
	return (
		<label>
			{label}
			<input value={value} onChange={(event) => onChange(event.target.value)} />
		</label>
	);
}

function Stat({ label, value }) {
	return (
		<div className="stat">
			<small>{label}</small>
			<b>{value ?? '-'}</b>
		</div>
	);
}

function Step({ done, title, text }) {
	return (
		<article className={done ? 'step done' : 'step'}>
			<span>{done ? '✓' : '•'}</span>
			<div>
				<b>{title}</b>
				<small>{text}</small>
			</div>
		</article>
	);
}

function StatusCard({ status, onLock }) {
	const minted = Number(status.total || 0);
	const progress = Math.min(100, Math.round((minted / MAX_SUPPLY) * 100));

	return (
		<div className="status-card">
			<div className="progress-wrap">
				<div className="progress-label">
					<span>Mint progress</span>
					<b>
						{status.total ?? '-'} / {MAX_SUPPLY}
					</b>
				</div>

				<div className="progress">
					<div style={{ width: `${progress}%` }} />
				</div>
			</div>

			<div className="status-grid">
				<StatusItem
					label="Collection"
					value={shortAddress(status.collection)}
					copyValue={status.collection}
				/>

				<StatusItem label="Current price" value={`${status.price ?? '-'} ETH`} />

				<StatusItem
					label="Bonded"
					value={status.bonded ? 'Yes' : 'No'}
					ok={status.bonded}
				/>

				<StatusItem
					label="Token"
					value={status.token ? shortAddress(status.token) : 'Not deployed'}
					ok={Boolean(status.token)}
					copyValue={status.token}
				/>

				<StatusItem
					label="Pool"
					value={status.pool ? shortAddress(status.pool) : 'Not created'}
					ok={Boolean(status.pool)}
					copyValue={status.pool}
				/>

				<StatusItem
					label="Vault locked"
					value={
						status.vaultLocked === null
							? 'Unknown'
							: status.vaultLocked
								? 'Locked'
								: 'Unlocked'
					}
					ok={Boolean(status.vaultLocked)}
				/>
			</div>

			<div className="links">
				{status.tx && (
					<a target="_blank" rel="noreferrer" href={explorerTx(status.tx)}>
						Open Tx
					</a>
				)}

				{status.collection && (
					<a
						target="_blank"
						rel="noreferrer"
						href={explorerAddress(status.collection)}
					>
						Open Collection
					</a>
				)}

				{status.token && (
					<a target="_blank" rel="noreferrer" href={explorerAddress(status.token)}>
						Open Token
					</a>
				)}

				{status.pool && (
					<a target="_blank" rel="noreferrer" href={explorerAddress(status.pool)}>
						Open Pool
					</a>
				)}

				{status.token && !status.vaultLocked && (
					<button type="button" onClick={onLock}>
						Lock Vault
					</button>
				)}
			</div>
		</div>
	);
}

function StatusItem({ label, value, ok, copyValue }) {
	return (
		<div className="status-item">
			<small>{label}</small>

			<div className="status-value">
				<b className={ok ? 'positive' : ''}>{value}</b>

				{copyValue && (
					<button
						type="button"
						className="copy-icon-btn"
						title={`Copy ${label}`}
						aria-label={`Copy ${label}`}
						onClick={() => copyText(copyValue, label)}
					>
						<CopyIcon />
					</button>
				)}
			</div>
		</div>
	);
}

createRoot(document.getElementById('root')).render(<App />);