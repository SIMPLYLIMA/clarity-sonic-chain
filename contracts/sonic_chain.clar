;; SonicChain - Audio Content Management Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-owner (err u101))
(define-constant err-already-registered (err u102))
(define-constant err-not-found (err u103))

;; Data structures
(define-map audio-tracks 
    { track-id: uint }
    {
        owner: principal,
        title: (string-ascii 50),
        artist: (string-ascii 50),
        timestamp: uint,
        license-type: (string-ascii 20),
        price: uint
    }
)

(define-map track-royalties
    { track-id: uint }
    { 
        total-earned: uint,
        last-payout: uint
    }
)

;; Data variables
(define-data-var last-track-id uint u0)

;; Public functions

;; Register new audio track
(define-public (register-track (title (string-ascii 50)) (artist (string-ascii 50)) (license-type (string-ascii 20)) (price uint))
    (let 
        (
            (track-id (+ (var-get last-track-id) u1))
        )
        (map-insert audio-tracks
            { track-id: track-id }
            {
                owner: tx-sender,
                title: title,
                artist: artist,
                timestamp: block-height,
                license-type: license-type,
                price: price
            }
        )
        (map-insert track-royalties
            { track-id: track-id }
            {
                total-earned: u0,
                last-payout: u0
            }
        )
        (var-set last-track-id track-id)
        (ok track-id)
    )
)

;; Transfer track ownership
(define-public (transfer-track (track-id uint) (new-owner principal))
    (let 
        (
            (track (unwrap! (map-get? audio-tracks { track-id: track-id }) err-not-found))
        )
        (asserts! (is-eq (get owner track) tx-sender) err-not-owner)
        (map-set audio-tracks
            { track-id: track-id }
            (merge track { owner: new-owner })
        )
        (ok true)
    )
)

;; Update track license
(define-public (update-license (track-id uint) (new-license-type (string-ascii 20)) (new-price uint))
    (let 
        (
            (track (unwrap! (map-get? audio-tracks { track-id: track-id }) err-not-found))
        )
        (asserts! (is-eq (get owner track) tx-sender) err-not-owner)
        (map-set audio-tracks
            { track-id: track-id }
            (merge track { 
                license-type: new-license-type,
                price: new-price 
            })
        )
        (ok true)
    )
)

;; Record royalty payment
(define-public (record-royalty (track-id uint) (amount uint))
    (let 
        (
            (royalties (unwrap! (map-get? track-royalties { track-id: track-id }) err-not-found))
            (track (unwrap! (map-get? audio-tracks { track-id: track-id }) err-not-found))
        )
        (asserts! (is-eq (get owner track) tx-sender) err-not-owner)
        (map-set track-royalties
            { track-id: track-id }
            {
                total-earned: (+ (get total-earned royalties) amount),
                last-payout: block-height
            }
        )
        (ok true)
    )
)

;; Read-only functions

(define-read-only (get-track-info (track-id uint))
    (map-get? audio-tracks { track-id: track-id })
)

(define-read-only (get-track-royalties (track-id uint))
    (map-get? track-royalties { track-id: track-id })
)