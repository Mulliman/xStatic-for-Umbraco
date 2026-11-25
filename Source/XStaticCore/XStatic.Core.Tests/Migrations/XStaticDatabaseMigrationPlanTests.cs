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

        /// <summary>
        /// Every migration state that has shipped, in order. Migrations are append-only: add new states to the end
        /// of this list and of the plan, and never edit, remove or reorder the ones already here.
        /// </summary>
        private static readonly string[] ShippedStates =
        [
            "init",
            "DeployerTargets",
            "UpgradeV13SiteConfigs",
        ];

        [Fact]
        public void ShippedStates_AreAPrefixOfThePlan_InOrder()
        {
            var path = PathFrom(string.Empty);

            Assert.True(path.Count >= ShippedStates.Length,
                $"The plan has {path.Count} states but {ShippedStates.Length} have shipped: {string.Join(" -> ", path)}");
            Assert.Equal(ShippedStates, path.GetRange(0, ShippedStates.Length));
            Assert.Equal(new XStaticDatabaseMigrationPlan().FinalState, path[^1]);
        }
    }
}
