// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./RecomNFT.sol";

contract RecomNFTDeployer {
    event NFTDeployed(address indexed nft, address indexed creator);

    function deployNFT(
        address owner,
        address creator,
        address factory,
        string calldata uri,
        string calldata collectionName,
        string calldata collectionSymbol,
        string calldata tokenName,
        string calldata tokenSymbol,
        uint256 startingMarketCapWei,
        uint256 baseMintPriceWei,
        uint256 priceStepWei
    ) external returns (address nft) {
        nft = address(new RecomNFT(
            owner,
            creator,
            factory,
            uri,
            collectionName,
            collectionSymbol,
            tokenName,
            tokenSymbol,
            startingMarketCapWei,
            baseMintPriceWei,
            priceStepWei
        ));
        emit NFTDeployed(nft, creator);
    }
}
