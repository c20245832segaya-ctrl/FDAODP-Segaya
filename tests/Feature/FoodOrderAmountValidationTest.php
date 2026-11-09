<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FoodOrderAmountValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_orders_above_the_supported_total_are_rejected(): void
    {
        $this->actingAs(User::factory()->create());

        $this->from('/food-orders/create')
            ->post('/food-orders', [
                'dispatch_id' => 'FD-TOO-LARGE',
                'customer_name' => 'Jamie Doe',
                'delivery_address' => '1 Example Street',
                'restaurant_name' => 'Example Kitchen',
                'delivery_fee' => '0.00',
                'items' => [
                    [
                        'menu_item_name' => 'Example meal',
                        'item_price' => '50000000.00',
                        'quantity' => 2,
                    ],
                ],
            ])
            ->assertSessionHasErrors('total_bill');
    }

    public function test_item_quantities_above_the_database_limit_are_rejected(): void
    {
        $this->actingAs(User::factory()->create());

        $this->from('/food-orders/create')
            ->post('/food-orders', [
                'dispatch_id' => 'FD-INVALID-QUANTITY',
                'customer_name' => 'Jamie Doe',
                'delivery_address' => '1 Example Street',
                'restaurant_name' => 'Example Kitchen',
                'delivery_fee' => '0.00',
                'items' => [
                    [
                        'menu_item_name' => 'Example meal',
                        'item_price' => '1.00',
                        'quantity' => 4294967296,
                    ],
                ],
            ])
            ->assertSessionHasErrors('items.0.quantity');
    }
}
