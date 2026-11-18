// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal stand-in for the SPACE ID Agent ID contract, for local
///         tests only. Real contract on BNB Chain:
///         0x60b9262456de011f7d15a54cdd8c48baaa8b022f
///         (name "SPACE ID Agent ID", symbol "AI", ERC-721, soulbound).
///         Only `balanceOf` is needed by AgentWall, so the mock only
///         implements that plus a `mint` helper for tests.
contract MockAgentID {
    mapping(address => uint256) private _balances;

    function mint(address to) external {
        _balances[to] += 1;
    }

    function balanceOf(address owner) external view returns (uint256) {
        return _balances[owner];
    }
}
