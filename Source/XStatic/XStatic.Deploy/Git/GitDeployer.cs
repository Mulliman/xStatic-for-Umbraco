using LibGit2Sharp;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace XStatic.Deploy.Git
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
            _remoteUrl = parameters["RemoteUrl"];
            _email = parameters["Email"];
            _username = parameters["Username"];
            _password = parameters["Password"];
            _branch = parameters["Branch"];
        }

        public async Task<DeployResult> DeployWholeSite(string folderPath)
        {
            var result = Deploy(folderPath);

            return new DeployResult
            {
                WasSuccessful = result
            };
        }

        public bool Deploy(string folderPath)
        {
            try
            {
                if (!Repository.IsValid(folderPath))
                {
                    CloneRepo(folderPath, _branch);
                }

                CommitAndPush(folderPath, _branch);
            }
            catch (Exception)
            {
                return false;
            }
            
            return true;
        }

        public void CloneRepo(string folderPath, string branch)
        {
            try
            {
                var tempdir = folderPath + "_temp";

                if(Directory.Exists(tempdir))
                {
                    Directory.Delete(tempdir, true);
                }

                Directory.Move(folderPath, tempdir);

                string clonedRepoPath = Repository.Clone(_remoteUrl, folderPath, new CloneOptions()
                {
                    CredentialsProvider = (_url, _user, _cred) => new UsernamePasswordCredentials
                    {
                        Username = _username,
                        Password = _password,
                    }
                });

                FileHelper.CopyFilesInFolder(tempdir, folderPath);
                Directory.Delete(tempdir);
            }
            catch (Exception e)
            {
                var message = e.Message;

                throw;
            }
        }

        public void CommitAndPush(string folderPath, string branch)
        {
            try
            {
                using (var repo = new Repository(folderPath))
                {
                    if(!repo.Branches.Any())
                    {
                        var initSig = GetSignature();
                        repo.Commit($"xStatic init", initSig, initSig);
                    }

                    if(repo.Branches?.FirstOrDefault(b => b.FriendlyName == branch) == null)
                    {
                        repo.CreateBranch(branch);
                    }

                    var gitBranch = Commands.Checkout(repo, branch);

                    Commands.Stage(repo, "*");

                    if( repo.RetrieveStatus().IsDirty)
                    {
                        var sig = GetSignature();

                        repo.Commit($"xStatic build {DateTime.Now.ToString("yyyy-MM-dd HH:mm")}", sig, sig);
                    }

                    Remote remote = repo.Network.Remotes["origin"];
                    var options = new PushOptions();
                    options.CredentialsProvider = (_url, _user, _cred) => new UsernamePasswordCredentials { Username = _username, Password = _password };
                    repo.Network.Push(remote, gitBranch.CanonicalName, options);
                }
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