using System.Collections.Generic;
using XStatic.Db;
using Xunit;

namespace XStatic.Core.Tests.Migrations
{
    public class XStaticDatabaseMigrationPlanTests
    {
        private static List<string> PathFrom(string state)
        {
            var plan = new XStaticDatabaseMigrationPlan();
            plan.Validate();

            var steps = new List<string>();
            while (plan.Transitions.TryGetValue(state, out var transition) && transition != null)
            {
                steps.Add(transition.TargetState);
                state = transition.TargetState;
            }

            return steps;
        }

        // A database upgraded from xStatic 13 is already at "init" (issue #76).
        [Fact]
        public void DatabaseUpgradedFromV13_RunsSiteConfigUpgrade()
        {
            Assert.Contains("UpgradeV13SiteConfigs", PathFrom("init"));
        }

        // Existing v17 installs need the step too, to widen MediaRootNodes.
        [Fact]
        public void ExistingV17Database_RunsSiteConfigUpgrade()
        {
            Assert.Contains("UpgradeV13SiteConfigs", PathFrom("DeployerTargets"));
        }

        [Fact]
        public void FinalState_IsSiteConfigUpgrade()
        {
            Assert.Equal("UpgradeV13SiteConfigs", new XStaticDatabaseMigrationPlan().FinalState);
        }
    }
}
