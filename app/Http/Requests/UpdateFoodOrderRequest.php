<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesOrderAmount;
use App\Models\FoodOrder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Validation\Rule;

class UpdateFoodOrderRequest extends FormRequest
{
    use ValidatesOrderAmount;

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $orderId = $this->route('food_order');

        return [
            'dispatch_id' => [
                'sometimes', 'required', 'string', 'max:100',
                Rule::unique('food_orders', 'dispatch_id')->ignore($orderId),
            ],
            'customer_name' => ['sometimes', 'required', 'string', 'max:255'],
            'delivery_address' => ['sometimes', 'required', 'string', 'max:1000'],
            'restaurant_name' => ['sometimes', 'required', 'string', 'max:255'],
            'delivery_fee' => ['sometimes', 'required', 'numeric', 'min:0', 'max:99999999.99', 'decimal:0,2'],
            'dispatch_status' => [
                'sometimes',
                Rule::in(['pending', 'assigned', 'preparing', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled']),
            ],
            'items' => ['sometimes', 'required', 'array', 'min:1'],
            'items.*.menu_item_name' => ['required', 'string', 'max:255'],
            'items.*.item_price' => ['required', 'numeric', 'min:0', 'max:99999999.99', 'decimal:0,2'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:4294967295'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $order = $this->route('food_order');

        if (! $order instanceof FoodOrder) {
            return;
        }

        if (
            ! $this->exists('items')
            && ! $this->exists('delivery_fee')
        ) {
            return;
        }

        $items = $this->exists('items')
            ? $this->input('items', [])
            : $order->items()
                ->get(['item_price', 'quantity'])
                ->map(fn ($item) => $item->only(['item_price', 'quantity']))
                ->all();

        $this->validateOrderAmount(
            $validator,
            $items,
            $this->input('delivery_fee', $order->delivery_fee)
        );
    }

    public function messages(): array
    {
        return [
            'dispatch_id.required' => 'A dispatch ID is required.',
            'dispatch_id.unique' => 'This dispatch ID is already in use.',
            'customer_name.required' => 'A customer name is required.',
            'delivery_address.required' => 'A delivery address is required.',
            'restaurant_name.required' => 'A restaurant name is required.',
            'delivery_fee.decimal' => 'The delivery fee may have no more than 2 decimal places.',
            'delivery_fee.max' => 'The delivery fee exceeds the maximum supported amount.',
            'dispatch_status.in' => 'The selected dispatch status is invalid.',
            'items.required' => 'Add at least one item to the order.',
            'items.min' => 'Add at least one item to the order.',
            'items.*.menu_item_name.required' => 'Each item must have a name.',
            'items.*.item_price.decimal' => 'Each item price may have no more than 2 decimal places.',
            'items.*.item_price.max' => 'An item price exceeds the maximum supported amount.',
            'items.*.quantity.min' => 'Each item quantity must be at least 1.',
            'items.*.quantity.max' => 'An item quantity exceeds the maximum supported amount.',
        ];
    }
}//.