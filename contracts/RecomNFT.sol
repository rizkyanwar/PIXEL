// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IRecomTokenFactory {
    function bondToken(string calldata tokenName, string calldata tokenSymbol, uint256 startingMarketCapWei) external returns(address token, address pool);
}

contract RecomNFT is ERC1155, Ownable {
    uint256 public constant MAX_SUPPLY = 3;
    uint256 public totalMinted;
    bool public bonded;
    address public factory;
    address public creator;
    string public collectionName;
    string public collectionSymbol;
    string public tokenName;
    string public tokenSymbol;
    uint256 public startingMarketCapWei;
    uint256 public baseMintPriceWei;
    uint256 public priceStepWei;
    address public token;
    address public pool;

    struct Listing { address seller; uint256 price; bool active; }
    mapping(uint256 => Listing) public listings;

    event Minted(address indexed buyer, uint256 indexed tokenId, uint256 price);
    event Bonded(address indexed token, address indexed pool);
    event Listed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event Bought(uint256 indexed tokenId, address indexed buyer, uint256 price, uint256 penalty);

    constructor(
        address owner_,
        address creator_,
        address factory_,
        string memory uri_,
        string memory collectionName_,
        string memory collectionSymbol_,
        string memory tokenName_,
        string memory tokenSymbol_,
        uint256 startingMarketCapWei_,
        uint256 baseMintPriceWei_,
        uint256 priceStepWei_
    ) ERC1155(uri_) Ownable(owner_) {
        creator = creator_;
        factory = factory_;
        collectionName = collectionName_;
        collectionSymbol = collectionSymbol_;
        tokenName = tokenName_;
        tokenSymbol = tokenSymbol_;
        startingMarketCapWei = startingMarketCapWei_;
        baseMintPriceWei = baseMintPriceWei_;
        priceStepWei = priceStepWei_;
    }

    function currentMintPrice() public view returns (uint256) { return baseMintPriceWei + (totalMinted * priceStepWei); }
    function rarityTier(uint256 tokenId) public pure returns (uint8) {
        if (tokenId <= 3) return 5; if (tokenId <= 10) return 4; if (tokenId <= 25) return 3; if (tokenId <= 45) return 2; if (tokenId <= 70) return 1; return 0;
    }

    function mint() external payable {
        require(totalMinted < MAX_SUPPLY, "Sold out");
        uint256 price = currentMintPrice();
        require(msg.value >= price, "Need ETH");
        totalMinted++;
        uint256 id = totalMinted;
        _mint(msg.sender, id, 1, "");
        payable(creator).transfer(price);
        if (msg.value > price) payable(msg.sender).transfer(msg.value - price);
        emit Minted(msg.sender, id, price);
        if (totalMinted == MAX_SUPPLY) _bond();
    }

    function _bond() internal {
        bonded = true;
        (token, pool) = IRecomTokenFactory(factory).bondToken(tokenName, tokenSymbol, startingMarketCapWei);
        emit Bonded(token, pool);
    }

    function listForSale(uint256 tokenId, uint256 price) external {
        require(balanceOf(msg.sender, tokenId) == 1, "Not owner");
        require(price > 0, "Bad price");
        setApprovalForAll(address(this), true);
        listings[tokenId] = Listing(msg.sender, price, true);
        emit Listed(tokenId, msg.sender, price);
    }

    function buyListed(uint256 tokenId) external payable {
        Listing memory l = listings[tokenId];
        require(l.active, "Not listed");
        require(msg.value >= l.price, "Need ETH");
        require(balanceOf(l.seller, tokenId) == 1, "Seller not owner");
        listings[tokenId].active = false;
        uint256 penalty = bonded ? 0 : l.price / 2;
        uint256 sellerAmount = l.price - penalty;
        _safeTransferFrom(l.seller, msg.sender, tokenId, 1, "");
        payable(l.seller).transfer(sellerAmount);
        if (penalty > 0) payable(creator).transfer(penalty);
        if (msg.value > l.price) payable(msg.sender).transfer(msg.value - l.price);
        emit Bought(tokenId, msg.sender, l.price, penalty);
    }
}
