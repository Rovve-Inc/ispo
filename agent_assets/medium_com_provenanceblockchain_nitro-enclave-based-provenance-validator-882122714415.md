URL: https://medium.com/provenanceblockchain/nitro-enclave-based-provenance-validator-882122714415
---
[Open in app](https://rsci.app.link/?%24canonical_url=https%3A%2F%2Fmedium.com%2Fp%2F882122714415&%7Efeature=LoOpenInAppButton&%7Echannel=ShowPostUnderCollection&source=---top_nav_layout_nav----------------------------------)

Sign up

[Sign in](/m/signin?operation=login&redirect=https%3A%2F%2Fmedium.com%2Fprovenanceblockchain%2Fnitro-enclave-based-provenance-validator-882122714415&source=post_page---top_nav_layout_nav-----------------------global_nav-----------)

[Homepage](/?source=---top_nav_layout_nav----------------------------------)

[Write](/m/signin?operation=register&redirect=https%3A%2F%2Fmedium.com%2Fnew-story&source=---top_nav_layout_nav-----------------------new_post_topnav-----------)

Sign up

[Sign in](/m/signin?operation=login&redirect=https%3A%2F%2Fmedium.com%2Fprovenanceblockchain%2Fnitro-enclave-based-provenance-validator-882122714415&source=post_page---top_nav_layout_nav-----------------------global_nav-----------)

![](https://miro.medium.com/v2/resize:fill:32:32/1*dmbNkD5D-u45r44go_cf0g.png)

# Nitro Enclave-Based Provenance Validator

## So you want to run a Provenance Validator?

[![Provenance Blockchain Foundation](https://miro.medium.com/v2/resize:fill:44:44/1*meAziw4hYQfj-Hp5-t_rZA.png)](/@provenanceblockchain?source=post_page---byline--882122714415--------------------------------)

[![Provenance Blockchain](https://miro.medium.com/v2/resize:fill:24:24/1*SxWyqeUi9JOWpvvLVGA2YA.png)](https://medium.com/provenanceblockchain?source=post_page---byline--882122714415--------------------------------)

[Provenance Blockchain Foundation](/@provenanceblockchain?source=post_page---byline--882122714415--------------------------------)

·

[Follow](/m/signin?actionUrl=https%3A%2F%2Fmedium.com%2F_%2Fsubscribe%2Fuser%2F8664a556f7c4&operation=register&redirect=https%3A%2F%2Fmedium.com%2Fprovenanceblockchain%2Fnitro-enclave-based-provenance-validator-882122714415&user=Provenance+Blockchain+Foundation&userId=8664a556f7c4&source=post_page-8664a556f7c4--byline--882122714415---------------------post_header-----------)

Published in

[Provenance Blockchain](https://medium.com/provenanceblockchain?source=post_page---byline--882122714415--------------------------------)

·

5 min read

·

Apr 28, 2022

--

Listen

Share

[![](https://miro.medium.com/v2/resize:fit:360/1*Gz5kHgYfIoF50mPo2Znvrw.jpeg)](https://explorer.provenance.io/validator/pbvaloper17yx96jtu0r24jp8gyxc8y8pj0lgvcz964w2gyg) [Treestaker Provenance Validator](https://explorer.provenance.io/validator/pbvaloper17yx96jtu0r24jp8gyxc8y8pj0lgvcz964w2gyg)

So you want to run a Provenance Validator? Before getting started with a step-by-step demo, it’s important to understand a few key concepts. [Provenance Blockchain](https://provenance.io/) is a [Cosmos](https://cosmos.network/)-based blockchain that uses [Tendermint](https://docs.tendermint.com/master/introduction/what-is-tendermint.html) for consensus. A Provenance Validator is a standard node with a signing component. That’s it! That’s not to say that deploying one should be treated lightly. The areas of importance and complexity will be security, maintenance, and monitoring. This demo will guide you through the process of deploying a secure validator by leveraging [Amazon Web Services](https://aws.amazon.com/). The accompanying code can be found [here](https://github.com/provenance-io/aws-validator) — familiarizing yourself with the code before continuing would be beneficial.

Tendermint recommends the usage of [Tendermint Key Management System](https://github.com/iqlusioninc/tmkms) (tmkms) when deploying Cosmos Validator to production environments. It supports a few [Hardware Security Modules](https://en.wikipedia.org/wiki/Hardware_security_module) for dedicated signing. These HSMs require a physical server, which amounts to a huge barrier to entry. For individuals that do not want to deal with physical security, stable power and networking, and logical security to prevent attacks, another solution exists. [AWS Nitro Enclave](https://aws.amazon.com/ec2/nitro/nitro-enclaves/) can be used as a secure signing component. Nitro Enclave is an isolated execution environment that can provide cryptographic attestation to AWS Key Management Service. By linking KMS solely to a specific Nitro Enclave environment, via IAM policies, you end up with a trusted and confidential execution environment that’s analogous to HSMs. [tmkms-light](https://github.com/crypto-com/tmkms-light), which mimics tmkms for multiple providers, will be leveraged in this demo to interface with Nitro Enclave. The generated signing key will never be in plaintext outside of the Nitro Enclave, and only the specific Nitro Enclave build can decrypt the key, but network-level security, maintenance, and monitoring are left up to the implementer.

Before setting up a validator, a Provenance Node must run and sync up to the latest block height. The minimum recommended instance size is `m5.xlarge` with a disk size of `1TB`. A public Amazon Machine Image is provided to assist with setup - `provenance-io-node-1650940832` at the time of writing. It will also need to be assigned a public IP address or make use of a NAT address. If you opted to leverage the provided terraform, subnets `demo_main_a_public` or `demo_main_a_private` will suffice. Below are the minimum security group requirements.

`demo_allow_strict_external_cosmos`

![](https://miro.medium.com/v2/resize:fit:700/0*AXm8e4SQhqosBAzl)

`demo_allow_outbound_internet_access`

![](https://miro.medium.com/v2/resize:fit:700/0*9GhtNablaMP7rhXT)

`demo_allow_tmkms`

![](https://miro.medium.com/v2/resize:fit:700/0*cmCr-SH9QA6kuJji)

You will also need the ability to ssh into this node, `demo_allow_personal_ssh` can be used.

# Sync a Provenance Node from the Genesis Block

# Optional — Download and Configure a Quick Sync

You can check the logs in `/var/log/provenanced.out.log` to verify that `provenanced` is running.

Now that most of the Provenance Node setup is complete, you’re now ready to set up the Tmkms Node. The minimum recommended instance size is `m5.xlarge`. This node will not be doing much, but it’s the minimum size instance that Nitro Enclave is enabled for. A public Amazon Machine Image is provided to assist with setup - `provenance-io-tmkms-1650940834` at the time of writing. If leveraging the demo code, the role `demo_tmkms_role` is also provided. When creating this instance, it is important that the Nitro Enclave setting is enabled. This instance can be placed in `demo_main_a_private` so that it is not assigned a public IP. Since `demo_main_a_private` is a private subnet that goes out of a NAT address, `demo_allow_internal_ssh` is provided so that you can ssh into this node by using the Provenance Node as a jump box. Below are the minimum security group requirements.

`demo_allow_outbound_internet_access`

![](https://miro.medium.com/v2/resize:fit:700/0*b7mcckyTRyzBqUEJ)

`demo_allow_tmkms`

![](https://miro.medium.com/v2/resize:fit:700/0*cNucN6A-YRh2wTAx)

# Configure Tmkms and Generate Attestations

Various cryptographic attestation values will be displayed. Update the KMS key policy to include these values.

You are now ready to generate a signing key. This will also save an encrypted version on the host. The encrypted file should be copied off the instance and saved somewhere securely in case the EBS volume was ever to be unrecoverable.

# Generate a Signing Key

# Prepare for Node link

# Connect Provenance Node to Tmkms

And with that, you now have a Provenance Node that is signing blocks in a Nitro Enclave! To create a validator from this node, all that’s left to do is to load the `operator` key with hash and submit a `tx staking create-validator` transaction!

This demo walks through starting a validator on Provenance and leveraging AWS Nitro Enclave in a minimal viable configuration. There are more robust, and publicly meshed, architectures such as [this](https://forum.cosmos.network/t/sentry-node-architecture-overview/454), but the validator and tmkms components described here would still interact in the same manner.

_STEVE CIRNER_

Steve is a software engineer from New Jersey working on defining what SRE at Figure means. He has spanned engineering and infrastructure throughout his career, and is outspoken on the greatness of Rust in both domains. Outside of work, he enjoys cooking on his Traeger, reading educational books, and running the [Treestaker Validator](https://explorer.provenance.io/validator/pbvaloper17yx96jtu0r24jp8gyxc8y8pj0lgvcz964w2gyg).

[![](https://miro.medium.com/v2/resize:fit:360/1*Gz5kHgYfIoF50mPo2Znvrw.jpeg)](https://explorer.provenance.io/validator/pbvaloper17yx96jtu0r24jp8gyxc8y8pj0lgvcz964w2gyg)

![](https://miro.medium.com/v2/da:true/resize:fit:0/5c50caa54067fd622d2f0fac18392213bf92f6e2fae89b691e62bceb40885e74)

## Sign up to discover human stories that deepen your understanding of the world.

## Free

Distraction-free reading. No ads.

Organize your knowledge with lists and highlights.

Tell your story. Find your audience.

Sign up for free

## Membership

Read member-only stories

Support writers you read most

Earn money for your writing

Listen to audio narrations

Read offline with the Medium app

Try for $5/month

[Provenance Blockchain](/tag/provenance-blockchain?source=post_page-----882122714415--------------------------------)

[Blockchain](/tag/blockchain?source=post_page-----882122714415--------------------------------)

[Validator Node](/tag/validator-node?source=post_page-----882122714415--------------------------------)

[Tutorial](/tag/tutorial?source=post_page-----882122714415--------------------------------)

[![Provenance Blockchain](https://miro.medium.com/v2/resize:fill:48:48/1*SxWyqeUi9JOWpvvLVGA2YA.png)](https://medium.com/provenanceblockchain?source=post_page---post_publication_info--882122714415--------------------------------)

[![Provenance Blockchain](https://miro.medium.com/v2/resize:fill:64:64/1*SxWyqeUi9JOWpvvLVGA2YA.png)](https://medium.com/provenanceblockchain?source=post_page---post_publication_info--882122714415--------------------------------)

Follow

[**Published in Provenance Blockchain**](https://medium.com/provenanceblockchain?source=post_page---post_publication_info--882122714415--------------------------------)

[127 Followers](/provenanceblockchain/followers?source=post_page---post_publication_info--882122714415--------------------------------)

· [Last published Jan 23, 2023](/provenanceblockchain/idk-the-hodlin-globes-b91fdedb9d7d?source=post_page---post_publication_info--882122714415--------------------------------)

Purpose-built to transform financial services, Provenance Blockchain enables institutions and fintechs to seamlessly and securely issue, transact, and service digitally-native financial assets at scale on a public blockchain, delivering material business and customer value.

Follow

[![Provenance Blockchain Foundation](https://miro.medium.com/v2/resize:fill:48:48/1*meAziw4hYQfj-Hp5-t_rZA.png)](/@provenanceblockchain?source=post_page---post_author_info--882122714415--------------------------------)

[![Provenance Blockchain Foundation](https://miro.medium.com/v2/resize:fill:64:64/1*meAziw4hYQfj-Hp5-t_rZA.png)](/@provenanceblockchain?source=post_page---post_author_info--882122714415--------------------------------)

Follow

[**Written by Provenance Blockchain Foundation**](/@provenanceblockchain?source=post_page---post_author_info--882122714415--------------------------------)

[267 Followers](/@provenanceblockchain/followers?source=post_page---post_author_info--882122714415--------------------------------)

· [6 Following](/@provenanceblockchain/following?source=post_page---post_author_info--882122714415--------------------------------)

The public open-source blockchain used by over 60 financial institutions. Billions of dollars of financial transactions have been executed on Provenance.

Follow

## No responses yet

[What are your thoughts?](/m/signin?operation=register&redirect=https%3A%2F%2Fmedium.com%2Fprovenanceblockchain%2Fnitro-enclave-based-provenance-validator-882122714415&source=---post_responses--882122714415---------------------respond_sidebar-----------)

Also publish to my profile

Respond

Respond

[Help](https://help.medium.com/hc/en-us?source=post_page-----882122714415--------------------------------)

[Status](https://medium.statuspage.io/?source=post_page-----882122714415--------------------------------)

[About](/about?autoplay=1&source=post_page-----882122714415--------------------------------)

[Careers](/jobs-at-medium/work-at-medium-959d1a85284e?source=post_page-----882122714415--------------------------------)

[Press](pressinquiries@medium.com?source=post_page-----882122714415--------------------------------)

[Blog](https://blog.medium.com/?source=post_page-----882122714415--------------------------------)

[Privacy](https://policy.medium.com/medium-privacy-policy-f03bf92035c9?source=post_page-----882122714415--------------------------------)

[Terms](https://policy.medium.com/medium-terms-of-service-9db0094a1e0f?source=post_page-----882122714415--------------------------------)

[Text to speech](https://speechify.com/medium?source=post_page-----882122714415--------------------------------)

[Teams](/business?source=post_page-----882122714415--------------------------------)