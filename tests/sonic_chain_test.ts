[Previous tests remain unchanged, adding new tests below]

Clarinet.test({
    name: "Cannot list a track license twice",
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
        
        // Try to list again
        let secondListing = chain.mineBlock([
            Tx.contractCall('sonic_chain', 'list-license', [
                types.uint(1),
                types.uint(600),
                types.uint(1000)
            ], deployer.address)
        ]);
        
        secondListing.receipts[0].result.expectErr(106); // err-already-listed
    }
});

Clarinet.test({
    name: "Can delist a track license",
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
        
        // Delist track
        let delist = chain.mineBlock([
            Tx.contractCall('sonic_chain', 'delist-license', [
                types.uint(1)
            ], deployer.address)
        ]);
        
        delist.receipts[0].result.expectOk();
        
        // Verify listing is inactive
        let getListing = chain.callReadOnlyFn(
            'sonic_chain',
            'get-license-listing',
            [types.uint(1)],
            deployer.address
        );
        
        let listing = getListing.result.expectSome().expectTuple();
        assertEquals(listing['active'], types.bool(false));
    }
});
