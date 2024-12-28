import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Can register a new audio track",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('sonic_chain', 'register-track', [
                types.ascii("Test Song"),
                types.ascii("Test Artist"),
                types.ascii("Standard License"),
                types.uint(1000)
            ], deployer.address)
        ]);
        
        block.receipts[0].result.expectOk();
        assertEquals(block.receipts[0].result, types.ok(types.uint(1)));
        
        // Verify track info
        let getTrack = chain.callReadOnlyFn(
            'sonic_chain',
            'get-track-info',
            [types.uint(1)],
            deployer.address
        );
        
        let track = getTrack.result.expectSome().expectTuple();
        assertEquals(track['title'], "Test Song");
        assertEquals(track['artist'], "Test Artist");
    }
});

Clarinet.test({
    name: "Can transfer track ownership",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        
        // First register a track
        let block = chain.mineBlock([
            Tx.contractCall('sonic_chain', 'register-track', [
                types.ascii("Test Song"),
                types.ascii("Test Artist"),
                types.ascii("Standard License"),
                types.uint(1000)
            ], deployer.address)
        ]);
        
        // Then transfer ownership
        let transfer = chain.mineBlock([
            Tx.contractCall('sonic_chain', 'transfer-track', [
                types.uint(1),
                types.principal(wallet1.address)
            ], deployer.address)
        ]);
        
        transfer.receipts[0].result.expectOk();
        
        // Verify new owner
        let getTrack = chain.callReadOnlyFn(
            'sonic_chain',
            'get-track-info',
            [types.uint(1)],
            deployer.address
        );
        
        let track = getTrack.result.expectSome().expectTuple();
        assertEquals(track['owner'], wallet1.address);
    }
});

Clarinet.test({
    name: "Can update license terms",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        
        // Register track
        let block = chain.mineBlock([
            Tx.contractCall('sonic_chain', 'register-track', [
                types.ascii("Test Song"),
                types.ascii("Test Artist"),
                types.ascii("Standard License"),
                types.uint(1000)
            ], deployer.address)
        ]);
        
        // Update license
        let update = chain.mineBlock([
            Tx.contractCall('sonic_chain', 'update-license', [
                types.uint(1),
                types.ascii("Premium License"),
                types.uint(2000)
            ], deployer.address)
        ]);
        
        update.receipts[0].result.expectOk();
        
        // Verify updates
        let getTrack = chain.callReadOnlyFn(
            'sonic_chain',
            'get-track-info',
            [types.uint(1)],
            deployer.address
        );
        
        let track = getTrack.result.expectSome().expectTuple();
        assertEquals(track['license-type'], "Premium License");
        assertEquals(track['price'], types.uint(2000));
    }
});