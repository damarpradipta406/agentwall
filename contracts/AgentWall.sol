// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AgentWall — on-chain guestbook for Agent ID holders
/// @notice Only wallets holding a Binance Agent ID can sign the wall.
///         Agent ID is the on-chain name of a Binance Agentic Wallet
///         (SPACE ID Agent ID, 0x60b9262456de011f7d15a54cdd8c48baaa8b022f
///         on BNB Chain, ERC-721, non-transferable, one per wallet).
///         The gate is enforced on-chain: every `sign()` call checks
///         `balanceOf(msg.sender) > 0` on the Agent ID contract, exactly
///         the integration point documented in the Binance announcement.
///         No Agent ID, no signature — the contract itself is the bouncer.
interface IAgentID {
    function balanceOf(address owner) external view returns (uint256);
}

contract AgentWall {
    /// @notice The Agent ID contract used as the gate.
    IAgentID public immutable agentId;

    /// @notice Deployer; can transfer ownership, has no other privileges.
    address public owner;

    /// @notice Total messages signed so far (also the next message id).
    uint256 public messageCount;

    /// @notice Max message length in bytes (tweet-sized).
    uint256 public constant MAX_MESSAGE_LENGTH = 280;

    struct Message {
        address signer;
        string text;
        uint256 timestamp;
    }

    Message[] private _messages;

    event MessageSigned(
        address indexed signer,
        uint256 indexed id,
        string text,
        uint256 timestamp
    );
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    error NotAgentIdHolder();
    error EmptyMessage();
    error MessageTooLong();
    error OutOfRange();

    modifier onlyAgentIdHolder() {
        if (agentId.balanceOf(msg.sender) == 0) revert NotAgentIdHolder();
        _;
    }

    constructor(address _agentId) {
        require(_agentId != address(0), "AgentWall: zero Agent ID address");
        agentId = IAgentID(_agentId);
        owner = msg.sender;
    }

    /// @notice Sign the wall. Only Agent ID holders can call this.
    function sign(string calldata text) external onlyAgentIdHolder {
        if (bytes(text).length == 0) revert EmptyMessage();
        if (bytes(text).length > MAX_MESSAGE_LENGTH)
            revert MessageTooLong();
        _messages.push(Message(msg.sender, text, block.timestamp));
        uint256 id = messageCount;
        messageCount += 1;
        emit MessageSigned(msg.sender, id, text, block.timestamp);
    }

    /// @notice Read one message by id.
    function getMessage(
        uint256 id
    )
        external
        view
        returns (address signer, string memory text, uint256 timestamp)
    {
        if (id >= messageCount) revert OutOfRange();
        Message storage m = _messages[id];
        return (m.signer, m.text, m.timestamp);
    }

    /// @notice Read a page of messages, oldest first.
    function getMessages(
        uint256 from,
        uint256 count
    ) external view returns (Message[] memory out) {
        if (from >= messageCount) return new Message[](0);
        uint256 end = from + count;
        if (end > messageCount) end = messageCount;
        out = new Message[](end - from);
        for (uint256 i = from; i < end; i++) {
            out[i - from] = _messages[i];
        }
    }

    /// @notice Convenience check used by the frontend: does `account`
    ///         hold an Agent ID?
    function isAgentIdHolder(address account) external view returns (bool) {
        return agentId.balanceOf(account) > 0;
    }

    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "AgentWall: not owner");
        require(newOwner != address(0), "AgentWall: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
