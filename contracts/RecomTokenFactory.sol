// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./RecomToken.sol";
import "./MockPool.sol";

interface IVaultRegister { function registerToken(address token) external; }

contract RecomTokenFactory {
    address public owner;
    address public launchpad;
    address public vault;

    mapping(address => bool) public validCollection;
    mapping(address => address) public collectionToken;
    mapping(address => address) public tokenPool;

    event CollectionAuthorized(address indexed collection);
    event TokenBonded(address indexed collection, address indexed token, address indexed pool, string name, string symbol);

    constructor(address vault_) { owner = msg.sender; vault = vault_; }
    modifier onlyOwner(){ require(msg.sender == owner, "Not owner"); _; }
    modifier onlyLaunchpad(){ require(msg.sender == launchpad, "Only launchpad"); _; }

    function setLaunchpad(address launchpad_) external onlyOwner { launchpad = launchpad_; }
    function authorizeCollection(address collection) external onlyLaunchpad { validCollection[collection] = true; emit CollectionAuthorized(collection); }

    function bondToken(string calldata tokenName, string calldata tokenSymbol, uint256 startingMarketCapWei) external returns(address token, address pool) {
        require(validCollection[msg.sender], "Bad collection");
        require(collectionToken[msg.sender] == address(0), "Already bonded");
        pool = address(new MockPool(address(0), startingMarketCapWei, 500_000_000 ether));
        token = address(new RecomToken(tokenName, tokenSymbol, pool, vault));
        MockPool realPool = new MockPool(token, startingMarketCapWei, 500_000_000 ether);
        pool = address(realPool);
        collectionToken[msg.sender] = token;
        tokenPool[token] = pool;
        IVaultRegister(vault).registerToken(token);
        emit TokenBonded(msg.sender, token, pool, tokenName, tokenSymbol);
    }
}
