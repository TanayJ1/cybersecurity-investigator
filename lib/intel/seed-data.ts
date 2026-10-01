export const starterIntel = [
  {
    slug: "mitre-brute-force",
    title: "Brute Force",
    category: "Credential Access",
    techniqueId: "T1110",
    source: "MITRE ATT&CK",
    description:
      "Brute force is a technique in which an adversary attempts to gain access to an account by repeatedly guessing passwords, credentials, or other authentication material. Investigators can review failed authentication patterns, source IPs, targeted accounts, successful logins after failures, and whether attempts are distributed across accounts. Failed logins alone do not prove malicious activity.",
  },
  {
    slug: "mitre-valid-accounts",
    title: "Valid Accounts",
    category: "Initial Access",
    techniqueId: "T1078",
    source: "MITRE ATT&CK",
    description:
      "An adversary may use legitimate account credentials to gain access to systems. Investigators should correlate authentication successes with preceding failures, unusual locations, new devices, privilege changes, and activity that differs from the account's normal pattern. A successful login alone is not evidence of account compromise.",
  },
  {
    slug: "mitre-network-discovery",
    title: "Network Service Discovery",
    category: "Discovery",
    techniqueId: "T1046",
    source: "MITRE ATT&CK",
    description:
      "Network service discovery involves identifying services running on remote hosts. Investigators may look for one source contacting many destination hosts or ports in a short period, unusual connection patterns, and repeated probes. A high number of destinations may also be caused by legitimate scanners or monitoring systems.",
  },
  {
    slug: "mitre-account-manipulation",
    title: "Account Manipulation",
    category: "Persistence",
    techniqueId: "T1098",
    source: "MITRE ATT&CK",
    description:
      "Account manipulation involves changing account properties to maintain or expand access. Relevant evidence may include unexpected changes to credentials, permissions, authentication methods, group membership, or account recovery settings. Audit logs and change records are needed to establish whether a change was authorized.",
  },
  {
    slug: "defense-authentication-hardening",
    title: "Authentication Hardening",
    category: "Mitigation",
    techniqueId: null,
    source: "Curated defensive guidance",
    description:
      "Defensive controls for suspicious authentication activity include multi-factor authentication, strong unique passwords, rate limiting, monitoring for successful logins following repeated failures, alerting on unusual account activity, and carefully configured lockout or challenge policies. Controls should be tuned to avoid locking out legitimate users.",
  },
];