// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface INFTDeployer {
    function deployNFT(address owner,address creator,address factory,string calldata uri,string calldata collectionName,string calldata collectionSymbol,string calldata tokenName,string calldata tokenSymbol,uint256 startingMarketCapWei,uint256 baseMintPriceWei,uint256 priceStepWei) external returns (address nft);
}
interface ITokenFactory { function authorizeCollection(address collection) external; }

contract RecomLaunchpad {
    struct LaunchParams {
        string uri;
        string collectionName;
        string collectionSymbol;
        string tokenName;
        string tokenSymbol;
        uint256 startingMarketCapWei;
        uint256 baseMintPriceWei;
        uint256 priceStepWei;
        uint256 decayWindow;
        uint8 feeType;
    }

    address public owner;
    address public nftDeployer;
    address public tokenFactory;
    uint256 public platformFeeETH;

    address[] public allCollections;
    mapping(address => address[]) public creatorCollections;
    mapping(address => bool) public isCollection;
    mapping(address => uint256) public collectionStartMc;
    mapping(address => bool) public collectionPairUSDC;
    mapping(address => uint256) public collectionDecay;
    mapping(address => uint8) public collectionFeeType;

    event CollectionLaunched(address indexed creator, address indexed collection, string name, string tokenName);

    constructor(address nftDeployer_, address tokenFactory_) { owner = msg.sender; nftDeployer = nftDeployer_; tokenFactory = tokenFactory_; }
    modifier onlyOwner(){ require(msg.sender == owner, "Not owner"); _; }

    function setPlatformFee(uint256 fee) external onlyOwner { platformFeeETH = fee; }

    function launchCollection(LaunchParams calldata p) external payable returns(address collection) {
        require(msg.value >= platformFeeETH, "Platform fee");
        require(bytes(p.collectionName).length > 0, "No name");
        require(bytes(p.tokenName).length > 0, "No token");
        collection = INFTDeployer(nftDeployer).deployNFT(address(this), msg.sender, tokenFactory, p.uri, p.collectionName, p.collectionSymbol, p.tokenName, p.tokenSymbol, p.startingMarketCapWei, p.baseMintPriceWei, p.priceStepWei);
        ITokenFactory(tokenFactory).authorizeCollection(collection);
        allCollections.push(collection);
        creatorCollections[msg.sender].push(collection);
        isCollection[collection] = true;
        collectionStartMc[collection] = p.startingMarketCapWei;
        collectionDecay[collection] = p.decayWindow;
        collectionFeeType[collection] = p.feeType;
        if (msg.value > platformFeeETH) payable(msg.sender).transfer(msg.value - platformFeeETH);
        if (platformFeeETH > 0) payable(owner).transfer(platformFeeETH);
        emit CollectionLaunched(msg.sender, collection, p.collectionName, p.tokenName);
    }

    function collectionCount() external view returns(uint256){ return allCollections.length; }
}
