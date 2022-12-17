# Deploy process

The deploy process is the second main process in xStatic. This stage takes the built output and pushes it to a location configured by the user. In the CMS dashboard you fill in these details in the Deployment Target field. The options available in this field are determined by the `IDeployer` implementations present in the code base. To learn about creating custom deployers, read the Deployers page.

## Open source deployment options

Built in to xStatic is a very simple file system based deployer, but there are more powerful alternatives available on NuGet. Search for Netlify, Git, Amazon, and FTP xStatic packages and add these to your solution.