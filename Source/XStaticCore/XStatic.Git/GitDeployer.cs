using LibGit2Sharp;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using XStatic.Core;
using XStatic.Core.Deploy;
using XStatic.Core.Helpers;

namespace XStatic.Git
{
    public class GitDeployer : IDeployer
    {
        public const string DeployerKey = "git";
        private readonly string _remoteUrl;
        private readonly string _email;
        private readonly string _username;
        private readonly string _password;
        private readonly string _branch;

        public GitDeployer(Dictionary<string, string> parameters)
        {
            _remoteUrl = parameters[GitDeployerDefinition.FieldNames.RemoteUrl];
            _email = parameters[GitDeployerDefinition.FieldNames.Email];
            _username = parameters[GitDeployerDefinition.FieldNames.Username];
            _password = parameters[GitDeployerDefinition.FieldNames.Password];
            _branch = parameters[GitDeployerDefinition.FieldNames.Branch];
        }

        public Task<XStaticResult> DeployWholeSite(string folderPath)
        {
            return TaskHelper.FromResultOf(() =>
            {
                var result = Deploy(folderPath);

                return result;
            });
        }

        public XStaticResult Deploy(string folderPath)
        {
            try
            {
                if (!Repository.IsValid(folderPath))
                {
                    CloneRepo(folderPath, _branch);
                }

                CommitAndPush(folderPath, _branch);
            }
            catch (Exception e)
            {
                return XStaticResult.Error("Error deploying site using Git.", RedactCredentials(e));
            }

            return XStaticResult.Success("Git branch committed and pushed to remote.");
        }

        /// <summary>
        /// Git errors can quote the remote URL, which may hold a username and token (https://user:token@host/...).
        /// The error is shown in the backoffice and written to the log, so when it contains the password or the
        /// URL's credentials, a copy with them replaced by *** is returned instead.
        /// </summary>
        protected virtual Exception RedactCredentials(Exception exception)
        {
            var secrets = new List<string>();

            if (!string.IsNullOrEmpty(_password) && _password.Length >= 3)
            {
                // Shorter passwords aren't replaced: "***" in place of every "ab" would wreck the message.
                secrets.Add(_password);
                secrets.Add(Uri.EscapeDataString(_password));
            }

            if (Uri.TryCreate(_remoteUrl, UriKind.Absolute, out var uri) && !string.IsNullOrEmpty(uri.UserInfo))
            {
                secrets.Add(uri.UserInfo);
                secrets.Add(Uri.UnescapeDataString(uri.UserInfo));
            }

            if (secrets.Count == 0)
            {
                return exception;
            }

            var messages = new List<string>();
            for (var current = exception; current != null; current = current.InnerException)
            {
                messages.Add(current.Message ?? string.Empty);
            }

            if (!messages.Any(m => secrets.Any(s => m.Contains(s, StringComparison.Ordinal))))
            {
                return exception;
            }

            var redacted = string.Join(" ", messages.Select(m =>
            {
                foreach (var secret in secrets.OrderByDescending(s => s.Length))
                {
                    m = m.Replace(secret, "***", StringComparison.Ordinal);
                }

                return m;
            }));

            return new XStaticException($"{exception.GetType().Name}: {redacted}");
        }

        public void CloneRepo(string folderPath, string branch)
        {
            var tempdir = folderPath + "_temp";

            if (Directory.Exists(tempdir))
            {
                Directory.Delete(tempdir, true);
            }

            // The generated site is moved aside so the remote can be cloned into the output folder,
            // then copied back on top of the clone.
            Directory.Move(folderPath, tempdir);

            try
            {
                var cloneOptions = new CloneOptions();
                cloneOptions.FetchOptions.CredentialsProvider = (_url, _user, _cred) => new UsernamePasswordCredentials
                {
                    Username = _username,
                    Password = _password,
                };

                Repository.Clone(_remoteUrl, folderPath, cloneOptions);
            }
            catch
            {
                // The clone failed (wrong URL, credentials or network). Put the generated site back, so it isn't
                // lost and the next attempt doesn't delete it along with the temp folder.
                if (Directory.Exists(folderPath))
                {
                    Directory.Delete(folderPath, true);
                }

                Directory.Move(tempdir, folderPath);
                throw;
            }

            FileHelpers.CopyFilesInFolder(tempdir, folderPath);
            Directory.Delete(tempdir, true);
        }

        public void CommitAndPush(string folderPath, string branch)
        {
            try
            {
                using var repo = new Repository(folderPath);

                if (!repo.Branches.Any())
                {
                    var initSig = GetSignature();
                    repo.Commit($"xStatic init", initSig, initSig);
                }

                if (repo.Branches?.FirstOrDefault(b => b.FriendlyName == branch) == null)
                {
                    repo.CreateBranch(branch);
                }

                var gitBranch = Commands.Checkout(repo, branch);

                Commands.Stage(repo, "*");

                if (repo.RetrieveStatus().IsDirty)
                {
                    var sig = GetSignature();

                    repo.Commit($"xStatic build {DateTime.Now.ToString("yyyy-MM-dd HH:mm")}", sig, sig);
                }

                Remote remote = repo.Network.Remotes["origin"];
                var options = new PushOptions();
                options.CredentialsProvider = (_url, _user, _cred) => new UsernamePasswordCredentials { Username = _username, Password = _password };
                repo.Network.Push(remote, gitBranch.CanonicalName, options);
            }
            catch (Exception e)
            {
                var message = e.Message;

                throw;
            }
        }

        private Signature GetSignature()
        {
            return new Signature(_username, _email, DateTimeOffset.Now);
        }
    }
}