;; Clarity 6 alimony agreement. STX amounts are denominated in micro-STX.

(define-constant ERR_ALREADY_CREATED (err u100))
(define-constant ERR_NO_AGREEMENT (err u101))
(define-constant ERR_INVALID_PAYEE (err u102))
(define-constant ERR_INVALID_TERMS (err u103))
(define-constant ERR_NOT_PAYER (err u104))
(define-constant ERR_OVERFUNDING (err u105))
(define-constant ERR_NOT_PAYEE (err u106))
(define-constant ERR_NOTHING_CLAIMABLE (err u107))
(define-constant ERR_PENDING_REQUEST_EXISTS (err u108))
(define-constant ERR_REQUEST_NOT_FOUND (err u109))
(define-constant ERR_REQUEST_NOT_PENDING (err u110))
(define-constant ERR_INVALID_DOCUMENT_HASH (err u111))
(define-constant STATUS_PENDING "pending")
(define-constant STATUS_APPROVED "approved")
(define-constant STATUS_REJECTED "rejected")

(define-data-var agreement-exists bool false)
(define-data-var agreement-payer (optional principal) none)
(define-data-var agreement-payee (optional principal) none)
(define-data-var agreement-amount-per-period uint u0)
(define-data-var agreement-period-blocks uint u0)
(define-data-var agreement-total-periods uint u0)
(define-data-var agreement-total-amount uint u0)
(define-data-var agreement-start-block uint u0)
(define-data-var total-deposited uint u0)
(define-data-var total-claimed uint u0)
(define-data-var approved-extra-amount uint u0)
(define-data-var next-extra-request-id uint u1)
(define-data-var pending-extra-request-id (optional uint) none)

(define-map extra-requests uint
  {
    request-id: uint,
    requester: principal,
    amount: uint,
    document-hash: (string-ascii 64),
    reason: (string-utf8 256),
    status: (string-ascii 8),
    created-at: uint
  })

(define-public (create-agreement
    (payee principal)
  (amount-per-period uint)
  (period-blocks uint)
  (total-periods uint))
  (begin
    (asserts! (not (var-get agreement-exists)) ERR_ALREADY_CREATED)
    (asserts! (not (is-eq tx-sender payee)) ERR_INVALID_PAYEE)
    (asserts! (> amount-per-period u0) ERR_INVALID_TERMS)
    (asserts! (> period-blocks u0) ERR_INVALID_TERMS)
    (asserts! (> total-periods u0) ERR_INVALID_TERMS)
    (var-set agreement-payer (some tx-sender))
    (var-set agreement-payee (some payee))
    (var-set agreement-amount-per-period amount-per-period)
    (var-set agreement-period-blocks period-blocks)
    (var-set agreement-total-periods total-periods)
    (var-set agreement-total-amount
      (* amount-per-period total-periods))
    (var-set agreement-start-block stacks-block-height)
    (var-set agreement-exists true)
    (print {
      event: "agreement-created",
      payer: tx-sender,
      payee: payee,
      amount-per-period: amount-per-period,
      period-blocks: period-blocks,
      total-periods: total-periods,
      total-amount: (var-get agreement-total-amount),
      start-block: (var-get agreement-start-block)
    })
    (ok true)))

(define-public (deposit (amount uint))
  (let (
      (maximum-amount (var-get agreement-total-amount))
      (deposited-amount (var-get total-deposited)))
    (asserts! (var-get agreement-exists) ERR_NO_AGREEMENT)
    (asserts! (is-eq (var-get agreement-payer) (some tx-sender)) ERR_NOT_PAYER)
    (asserts! (> amount u0) ERR_INVALID_TERMS)
    (asserts!
      (<= amount (- maximum-amount deposited-amount))
      ERR_OVERFUNDING)
    (try! (stx-transfer? amount tx-sender current-contract))
    (var-set total-deposited (+ deposited-amount amount))
    (print {
      event: "deposit",
      payer: tx-sender,
      amount: amount,
      total-deposited: (var-get total-deposited)
    })
    (ok amount)))

(define-read-only (get-claimable-amount)
  (if (var-get agreement-exists)
    (let (
        (blocks-since-start
          (if (> stacks-block-height (var-get agreement-start-block))
            (- stacks-block-height (var-get agreement-start-block))
            u0))
        (periods-elapsed (/ blocks-since-start (var-get agreement-period-blocks)))
        (periods-vested
          (if (> periods-elapsed (var-get agreement-total-periods))
            (var-get agreement-total-periods)
            periods-elapsed))
        (base-vested (* periods-vested (var-get agreement-amount-per-period)))
        (vested-total (+ base-vested (var-get approved-extra-amount)))
        (claimed-amount (var-get total-claimed))
        (deposited-amount (var-get total-deposited)))
      (let (
          (vested-unclaimed
            (if (> vested-total claimed-amount)
              (- vested-total claimed-amount)
              u0))
          (funded-unclaimed
            (if (> deposited-amount claimed-amount)
              (- deposited-amount claimed-amount)
              u0)))
        (if (< vested-unclaimed funded-unclaimed)
          vested-unclaimed
          funded-unclaimed)))
    u0))

(define-public (claim)
  (let (
      (claimant tx-sender)
      (claimable (get-claimable-amount)))
    (asserts! (is-eq (var-get agreement-payee) (some claimant)) ERR_NOT_PAYEE)
    (asserts! (> claimable u0) ERR_NOTHING_CLAIMABLE)
    (try!
      (as-contract? ((with-stx claimable))
        (try! (stx-transfer? claimable tx-sender claimant))))
    (var-set total-claimed (+ (var-get total-claimed) claimable))
    (print {
      event: "claim",
      payee: claimant,
      amount: claimable,
      total-claimed: (var-get total-claimed)
    })
    (ok claimable)))

(define-public (request-extra-funds
    (amount uint)
    (document-hash (string-ascii 64))
    (reason (string-utf8 256)))
  (let ((request-id (var-get next-extra-request-id)))
    (asserts! (var-get agreement-exists) ERR_NO_AGREEMENT)
    (asserts! (is-eq (var-get agreement-payee) (some tx-sender)) ERR_NOT_PAYEE)
    (asserts! (is-none (var-get pending-extra-request-id)) ERR_PENDING_REQUEST_EXISTS)
    (asserts! (> amount u0) ERR_INVALID_TERMS)
    (asserts! (is-eq (len document-hash) u64) ERR_INVALID_DOCUMENT_HASH)
    (map-set extra-requests request-id
      {
        request-id: request-id,
        requester: tx-sender,
        amount: amount,
        document-hash: document-hash,
        reason: reason,
        status: STATUS_PENDING,
        created-at: stacks-block-height
      })
    (var-set next-extra-request-id (+ request-id u1))
    (var-set pending-extra-request-id (some request-id))
    (print {
      event: "extra-funds-requested",
      request-id: request-id,
      requester: tx-sender,
      amount: amount,
      document-hash: document-hash,
      created-at: stacks-block-height
    })
    (ok request-id)))

(define-public (approve-extra-request (request-id uint))
  (let ((request (unwrap! (map-get? extra-requests request-id) ERR_REQUEST_NOT_FOUND)))
    (asserts! (var-get agreement-exists) ERR_NO_AGREEMENT)
    (asserts! (is-eq (var-get agreement-payer) (some tx-sender)) ERR_NOT_PAYER)
    (asserts!
      (is-eq (var-get pending-extra-request-id) (some request-id))
      ERR_REQUEST_NOT_PENDING)
    (asserts! (is-eq (get status request) STATUS_PENDING) ERR_REQUEST_NOT_PENDING)
    (map-set extra-requests request-id
      (merge request { status: STATUS_APPROVED }))
    (var-set approved-extra-amount
      (+ (var-get approved-extra-amount) (get amount request)))
    (var-set agreement-total-amount
      (+ (var-get agreement-total-amount) (get amount request)))
    (var-set pending-extra-request-id none)
    (print {
      event: "extra-funds-approved",
      request-id: request-id,
      payer: tx-sender,
      amount: (get amount request),
      approved-extra-amount: (var-get approved-extra-amount)
    })
    (ok true)))

(define-public (reject-extra-request (request-id uint))
  (let ((request (unwrap! (map-get? extra-requests request-id) ERR_REQUEST_NOT_FOUND)))
    (asserts! (var-get agreement-exists) ERR_NO_AGREEMENT)
    (asserts! (is-eq (var-get agreement-payer) (some tx-sender)) ERR_NOT_PAYER)
    (asserts!
      (is-eq (var-get pending-extra-request-id) (some request-id))
      ERR_REQUEST_NOT_PENDING)
    (asserts! (is-eq (get status request) STATUS_PENDING) ERR_REQUEST_NOT_PENDING)
    (map-set extra-requests request-id
      (merge request { status: STATUS_REJECTED }))
    (var-set pending-extra-request-id none)
    (print {
      event: "extra-funds-rejected",
      request-id: request-id,
      payer: tx-sender,
      amount: (get amount request)
    })
    (ok true)))

(define-read-only (get-request (request-id uint))
  (map-get? extra-requests request-id))

(define-read-only (get-pending-requests)
  (match (var-get pending-extra-request-id)
    request-id
      (match (map-get? extra-requests request-id)
        request (list request)
        (list))
    (list)))

(define-read-only (get-contract-balance)
  (stx-get-balance current-contract))

(define-read-only (get-agreement)
  {
    agreement-exists: (var-get agreement-exists),
    payer: (var-get agreement-payer),
    payee: (var-get agreement-payee),
    amount-per-period: (var-get agreement-amount-per-period),
    period-blocks: (var-get agreement-period-blocks),
    total-periods: (var-get agreement-total-periods),
    total-amount: (var-get agreement-total-amount),
    approved-extra-amount: (var-get approved-extra-amount),
    start-block: (var-get agreement-start-block),
    total-deposited: (var-get total-deposited),
    total-claimed: (var-get total-claimed),
    pending-extra-request-id: (var-get pending-extra-request-id)
  })