[Previous tests remain unchanged]

Clarinet.test({
    name: "Can relist a track license after expiration",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        
        // Register and list track
        let block = chain.mineBlock([
            Tx.contractCall('sonic_chain', 'register-track', [
                types.ascii("Test Song"),
                types.ascii("Test Artist"),
                types.ascii("Standard License"),
                types.uint(1000)
            ], deployer.address),
            Tx.contractCall('sonic_chain', 'list-license', [
                types.uint(1),
                types.uint(500),
                types.uint(10)
            ], deployer.address)
        ]);
        
        // Advance blockchain past expiration
        chain.mineEmptyBlockUntil(20);
        
        // Try to relist
        let relisting = chain.mineBlock([
            Tx.contractCall('sonic_chain', 'list-license', [
                types.uint(1),
                types.uint(600),
                types.uint(1000)
            ], deployer.address)
        ]);
        
        relisting.receipts[0].result.expectOk();
    }
});

Clarinet.test({
    name: "Cannot purchase own track license",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        
        // Register and list track
        let block = chain.mineBlock([
            Tx.contractCall('sonic_chain', 'register-track', [
                types.ascii("Test Song"),
                types.ascii("Test Artist"),
                types.ascii("Standard License"),
                types.uint(1000)
            ], deployer.address),
            Tx.contractCall('sonic_chain', 'list-license', [
                types.uint(1),
                types.uint(500),
                types.uint(1000)
            ], deployer.address)
        ]);
        
        // Try to purchase own listing
        let purchase = chain.mineBlock([
            Tx.contractCall('sonic_chain', 'purchase-license', [
                types.uint(1)
            ], deployer.address)
        ]);
        
        purchase.receipts[0].result.expectErr(109); // err-self-purchase
    }
});
