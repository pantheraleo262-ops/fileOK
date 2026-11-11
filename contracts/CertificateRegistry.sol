// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CertificateRegistry
 * @dev Multi-University Academic Credential Registry & Verification Ledger
 * Designed for enterprise-grade university degree anchoring, tamper-detection, and revocation.
 */
contract CertificateRegistry {
    address public owner;

    struct University {
        string name;
        address authorizedSigner;
        bool isActive;
        uint256 registeredAt;
    }

    struct CertificateRecord {
        bytes32 certHash;          // Digital Fingerprint (SHA-256 or Keccak256)
        uint256 universityCode;     // University Code (e.g. 1042, 2091)
        string certId;             // Verifiable Certificate ID (e.g. CERT-HSITM-2026-0482)
        string studentRoll;        // Roll / Student Registration Number
        uint256 timestamp;         // Block timestamp of issuance
        address signer;            // Institutional Signer address
        bool isValid;              // Validity state (false if revoked)
        string revocationReason;   // Revocation reason if invalidated
    }

    // universityCode => University Details
    mapping(uint256 => University) public universities;
    
    // certHash => CertificateRecord
    mapping(bytes32 => CertificateRecord) public certificates;

    // certId => certHash (lookup helper)
    mapping(string => bytes32) public certIdToHash;

    // List of registered university codes
    uint256[] public registeredUniversityCodes;

    // Events
    event UniversityRegistered(uint256 indexed universityCode, string name, address indexed signer);
    event CertificateIssued(
        bytes32 indexed certHash,
        uint256 indexed universityCode,
        string certId,
        string studentRoll,
        address signer,
        uint256 timestamp
    );
    event BatchIssued(uint256 indexed universityCode, uint256 count, uint256 timestamp);
    event CertificateRevoked(bytes32 indexed certHash, string reason, address indexed revoker, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only registry administrator permitted");
        _;
    }

    modifier onlyUniversitySigner(uint256 _universityCode) {
        University memory u = universities[_universityCode];
        require(u.isActive, "University registry inactive or unlisted");
        require(
            msg.sender == u.authorizedSigner || msg.sender == owner,
            "Caller not authorized as Institutional Signer"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        
        // Seed default institutional registries
        _registerUniversity(1042, "Haryana State Tech University", msg.sender);
        _registerUniversity(2091, "Delhi Technological University", msg.sender);
        _registerUniversity(3054, "National Institute of Technology", msg.sender);
    }

    function _registerUniversity(uint256 _code, string memory _name, address _signer) internal {
        require(_signer != address(0), "Invalid signer address");
        if (!universities[_code].isActive) {
            registeredUniversityCodes.push(_code);
        }
        universities[_code] = University({
            name: _name,
            authorizedSigner: _signer,
            isActive: true,
            registeredAt: block.timestamp
        });
        emit UniversityRegistered(_code, _name, _signer);
    }

    function registerUniversity(
        uint256 _universityCode,
        string calldata _name,
        address _signer
    ) external onlyOwner {
        _registerUniversity(_universityCode, _name, _signer);
    }

    /**
     * @notice Issue and anchor a single academic certificate digital fingerprint
     */
    function issueCertificate(
        bytes32 _certHash,
        uint256 _universityCode,
        string calldata _certId,
        string calldata _studentRoll
    ) external onlyUniversitySigner(_universityCode) {
        require(certificates[_certHash].timestamp == 0, "Digital fingerprint already anchored");
        require(certIdToHash[_certId] == bytes32(0), "Certificate ID already registered");

        certificates[_certHash] = CertificateRecord({
            certHash: _certHash,
            universityCode: _universityCode,
            certId: _certId,
            studentRoll: _studentRoll,
            timestamp: block.timestamp,
            signer: msg.sender,
            isValid: true,
            revocationReason: ""
        });

        certIdToHash[_certId] = _certHash;

        emit CertificateIssued(_certHash, _universityCode, _certId, _studentRoll, msg.sender, block.timestamp);
    }

    /**
     * @notice Batch anchor multiple graduate certificates in a single atomic call
     */
    function issueBatch(
        bytes32[] calldata _certHashes,
        uint256 _universityCode,
        string[] calldata _certIds,
        string[] calldata _studentRolls
    ) external onlyUniversitySigner(_universityCode) {
        uint256 length = _certHashes.length;
        require(
            length == _certIds.length && length == _studentRolls.length,
            "Mismatched batch array lengths"
        );
        require(length > 0, "Batch cannot be empty");

        for (uint256 i = 0; i < length; i++) {
            bytes32 cHash = _certHashes[i];
            string calldata cId = _certIds[i];
            string calldata sRoll = _studentRolls[i];

            require(certificates[cHash].timestamp == 0, "Digital fingerprint duplicate in batch");
            require(certIdToHash[cId] == bytes32(0), "Certificate ID duplicate in batch");

            certificates[cHash] = CertificateRecord({
                certHash: cHash,
                universityCode: _universityCode,
                certId: cId,
                studentRoll: sRoll,
                timestamp: block.timestamp,
                signer: msg.sender,
                isValid: true,
                revocationReason: ""
            });

            certIdToHash[cId] = cHash;

            emit CertificateIssued(cHash, _universityCode, cId, sRoll, msg.sender, block.timestamp);
        }

        emit BatchIssued(_universityCode, length, block.timestamp);
    }

    /**
     * @notice Verify a certificate by its digital fingerprint
     */
    function verifyCertificate(bytes32 _certHash)
        external
        view
        returns (
            bool exists,
            bool isValid,
            uint256 universityCode,
            string memory universityName,
            string memory certId,
            string memory studentRoll,
            uint256 timestamp,
            address signer,
            string memory revocationReason
        )
    {
        CertificateRecord memory record = certificates[_certHash];
        if (record.timestamp == 0) {
            return (false, false, 0, "", "", "", 0, address(0), "");
        }
        string memory uName = universities[record.universityCode].name;
        return (
            true,
            record.isValid,
            record.universityCode,
            uName,
            record.certId,
            record.studentRoll,
            record.timestamp,
            record.signer,
            record.revocationReason
        );
    }

    /**
     * @notice Revoke a certificate in case of disciplinary action or administrative error
     */
    function revokeCertificate(bytes32 _certHash, string calldata _reason) external {
        CertificateRecord storage record = certificates[_certHash];
        require(record.timestamp != 0, "Certificate not found");
        University memory u = universities[record.universityCode];
        require(
            msg.sender == u.authorizedSigner || msg.sender == owner,
            "Unauthorized to revoke this university credential"
        );
        require(record.isValid, "Certificate already revoked");

        record.isValid = false;
        record.revocationReason = _reason;

        emit CertificateRevoked(_certHash, _reason, msg.sender, block.timestamp);
    }
}
