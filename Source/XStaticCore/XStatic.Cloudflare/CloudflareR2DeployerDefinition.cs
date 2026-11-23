using System.Collections.Generic;
using XStatic.Core.Deploy;

namespace XStatic.Cloudflare
{
    public class CloudflareR2DeployerDefinition : IDeployerDefinition
    {
        public class FieldNames
        {
            public const string AccountId = "CloudflareR2.AccountId";
            public const string BucketName = "CloudflareR2.BucketName";
            public const string AccessKeyId = "CloudflareR2.AccessKeyId";
            public const string SecretAccessKey = "CloudflareR2.SecretAccessKey";
            public const string KeyPrefix = "CloudflareR2.KeyPrefix";
            public const string EndpointOverride = "CloudflareR2.EndpointOverride";
        }

        public string Id => CloudflareR2Deployer.DeployerKey;

        public string Name => "Cloudflare R2";

        public string Help =>
            "Uploads your generated static site directly to a Cloudflare R2 bucket via the S3-compatible API (AWS SigV4). " +
            "In the Cloudflare dashboard, create an R2 bucket, then go to <strong>R2 Object Storage &rarr; Manage R2 API Tokens &rarr; Create API Token</strong> " +
            "with <strong>Object Read &amp; Write</strong> permissions and copy the S3 <strong>Access Key ID</strong> and <strong>Secret Access Key</strong> " +
            "(these are separate from a regular Cloudflare Pages API token). To view the site publicly, enable an <code>r2.dev</code> subdomain or custom domain in your bucket settings.";

        public IEnumerable<DeployerField> Fields => new[]
        {
            new DeployerField { Alias = FieldNames.AccountId, Name = "Account ID *", EditorUiAlias = UIEditors.Text, Help = "Your 32-character Cloudflare Account ID (found in the Cloudflare dashboard URL or R2 overview). Required unless Endpoint URL Override is set." },
            new DeployerField { Alias = FieldNames.BucketName, Name = "Bucket Name *", EditorUiAlias = UIEditors.Text, Help = "The exact name of your existing Cloudflare R2 bucket (e.g. 'my-static-site')." },
            new DeployerField { Alias = FieldNames.AccessKeyId, Name = "Access Key ID *", EditorUiAlias = UIEditors.Text, Help = "S3 Access Key ID generated under R2 Object Storage -> Manage R2 API Tokens (Object Read & Write)." },
            new DeployerField { Alias = FieldNames.SecretAccessKey, Name = "Secret Access Key *", EditorUiAlias = UIEditors.Password, Help = "S3 Secret Access Key paired with the Access Key ID above." },
            new DeployerField { Alias = FieldNames.KeyPrefix, Name = "Key Prefix (optional)", EditorUiAlias = UIEditors.Text, Help = "Optional subfolder prefix within the bucket (e.g. 'site/'). Leave blank to upload to the bucket root." },
            new DeployerField { Alias = FieldNames.EndpointOverride, Name = "Endpoint URL Override (optional)", EditorUiAlias = UIEditors.Text, Help = "Leave blank for standard R2 buckets (uses https://<accountId>.r2.cloudflarestorage.com). For EU/jurisdiction buckets, enter the host URL only (e.g. https://<accountId>.eu.r2.cloudflarestorage.com) without /<bucketName>." }
        };
    }
}
