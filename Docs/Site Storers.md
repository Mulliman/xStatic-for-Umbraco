# Site Storers

Site storers are the component that stores the generated files ready for use by the deployer process in xStatic. By default the files are stored in numbered folders in the App_Data folder of an Umbraco site. If you need to store the generated files in alternative locations you can implement the `IStaticSiteStorer` interface.

You will then need to register this service instead of the default AppDataSiteStorer registration. In order to do this you'll have to manually call the separate methods in GeneratorServiceBuilder rather than relying on the Automatic() method normally used.