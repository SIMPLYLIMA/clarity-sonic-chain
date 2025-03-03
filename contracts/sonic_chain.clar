;; SonicChain - Audio Content Management Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-owner (err u101))  
(define-constant err-already-registered (err u102))
(define-constant err-not-found (err u103))
(define-constant err-invalid-price (err u104))
(define-constant err-insufficient-funds (err u105))
(define-constant err-already-listed (err u106))
(define-constant err-invalid-duration (err u107))
(define-constant err-listing-expired (err u108))
(define-constant err-self-purchase (err u109))

;; List track license for sale
(define-public (list-license (track-id uint) (price uint) (duration uint))
    (let
        (
            (track (unwrap! (map-get? audio-tracks { track-id: track-id }) err-not-found))
            (existing-listing (map-get? license-marketplace { track-id: track-id }))
        )
        (asserts! (is-eq (get owner track) tx-sender) err-not-owner)
        (asserts! (> price u0) err-invalid-price)
        (asserts! (>= duration u1) err-invalid-duration)
        (asserts! 
            (or 
                (is-none existing-listing)
                (not (get active (unwrap! existing-listing err-not-found)))
                (<= (get expires (unwrap! existing-listing err-not-found)) block-height)
            ) 
            err-already-listed
        )
        
        (map-set audio-tracks
            { track-id: track-id }
            (merge track { for-sale: true })
        )
        (map-set license-marketplace
            { track-id: track-id }
            {
                buyer: tx-sender,
                price: price,
                expires: (+ block-height duration),
                active: true
            }
        )
        (ok true)
    )
)

;; Delist a track license
(define-public (delist-license (track-id uint))
    (let
        (
            (track (unwrap! (map-get? audio-tracks { track-id: track-id }) err-not-found))
            (listing (unwrap! (map-get? license-marketplace { track-id: track-id }) err-not-found))
        )
        (asserts! (is-eq (get owner track) tx-sender) err-not-owner)
        (asserts! (get active listing) err-not-found)
        
        (begin
            (map-set audio-tracks
                { track-id: track-id }
                (merge track { for-sale: false })
            )
            (map-set license-marketplace
                { track-id: track-id }
                (merge listing { active: false })
            )
            (ok true)
        )
    )
)

;; Purchase track license
(define-public (purchase-license (track-id uint))
    (let
        (
            (track (unwrap! (map-get? audio-tracks { track-id: track-id }) err-not-found))
            (listing (unwrap! (map-get? license-marketplace { track-id: track-id }) err-not-found))
        )
        (asserts! (get for-sale track) err-not-found)
        (asserts! (get active listing) err-not-found)
        (asserts! (<= block-height (get expires listing)) err-listing-expired)
        (asserts! (>= (stx-get-balance tx-sender) (get price listing)) err-insufficient-funds)
        (asserts! (not (is-eq tx-sender (get owner track))) err-self-purchase)
        
        ;; [Rest of the function remains unchanged]
    )
)
