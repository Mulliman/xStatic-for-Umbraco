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
            "Uploads your generated static site directly to a Cloudflare R2 bucket via the S3-compatible API using AWS SigV4 signing. " +
            "Create an R2 API token with <strong>Object Read &amp; Write</strong> permissions in the Cloudflare dashboard under R2 &rarr; Manage R2 API Tokens.";

        public IEnumerable<DeployerField> Fields => new[]
        {
            new DeployerField { Alias = FieldNames.AccountId, Name = "Account ID", EditorUiAlias = UIEditors.Text },
            new DeployerField { Alias = FieldNames.BucketName, Name = "Bucket Name", EditorUiAlias = UIEditors.Text },
            new DeployerField { Alias = FieldNames.AccessKeyId, Name = "Access Key ID", EditorUiAlias = UIEditors.Text },
            new DeployerField { Alias = FieldNames.SecretAccessKey, Name = "Secret Access Key", EditorUiAlias = UIEditors.Password },
            new DeployerField { Alias = FieldNames.KeyPrefix, Name = "Key Prefix (optional)", EditorUiAlias = UIEditors.Text, Help = "Optional subfolder prefix within the bucket (e.g. 'site/')." },
            new DeployerField { Alias = FieldNames.EndpointOverride, Name = "Endpoint URL Override (optional)", EditorUiAlias = UIEditors.Text, Help = "Optional S3 endpoint override (e.g. EU jurisdiction endpoint https://<accountId>.eu.r2.cloudflarestorage.com)." }
        };
    }
}
