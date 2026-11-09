<?php

namespace App\Http\Requests\Concerns;

use Illuminate\Contracts\Validation\Validator;

trait ValidatesOrderAmount
{
    private const MAX_TOTAL_CENTS = 9_999_999_999;

    protected function validateOrderAmount(
        Validator $validator,
        mixed $items,
        mixed $deliveryFee
    ): void {
        $validator->after(function (Validator $validator) use ($items, $deliveryFee) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            if (! is_array($items) || ! is_numeric($deliveryFee)) {
                return;
            }

            $totalCents = (int) round((float) $deliveryFee * 100);

            foreach ($items as $item) {
                if (
                    ! is_array($item)
                    || ! isset($item['item_price'], $item['quantity'])
                    || ! is_numeric($item['item_price'])
                    || ! is_numeric($item['quantity'])
                ) {
                    return;
                }

                $priceCents = (int) round((float) $item['item_price'] * 100);
                $quantity = (int) $item['quantity'];
                $remainingCents = self::MAX_TOTAL_CENTS - $totalCents;

                if (
                    $priceCents > 0
                    && $quantity > intdiv($remainingCents, $priceCents)
                ) {
                    $validator->errors()->add(
                        'total_bill',
                        'The order total exceeds the maximum supported amount of 99,999,999.99.'
                    );

                    return;
                }

                $totalCents += $priceCents * $quantity;
            }
        });
    }
}
