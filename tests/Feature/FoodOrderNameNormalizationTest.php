<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FoodOrderNameNormalizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_and_restaurant_names_are_capitalized_when_saved(): void
    {
        $this->actingAs(User::factory()->create());

        $this->post('/food-orders', [
            'dispatch_id' => 'FD-NAME-CASE',
            'customer_name' => 'jamie doe',
            'delivery_address' => '1 Example Street',
            'restaurant_name' => 'example kitchen',
            'delivery_fee' => '10.00',
            'items' => [
                [
                    'menu_item_name' => 'Example meal',
                    'item_price' => '25.00',
                    'quantity' => 1,
                ],
            ],
        ])->assertRedirect('/food-orders');

        $this->assertDatabaseHas('customers', [
            'customer_name' => 'Jamie Doe',
        ]);
        $this->assertDatabaseHas('restaurants', [
            'restaurant_name' => 'Example Kitchen',
        ]);
    }

    public function test_updated_customer_names_are_capitalized_when_saved(): void
    {
        $this->actingAs(User::factory()->create());

        $customer = Customer::create([
            'customer_name' => 'Existing Name',
            'delivery_address' => '1 Example Street',
        ]);
        $restaurant = Restaurant::create(['restaurant_name' => 'Example Kitchen']);

        $order = \App\Models\FoodOrder::create([
            'dispatch_id' => 'FD-NAME-UPDATE',
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'delivery_fee' => 0,
            'subtotal' => 0,
            'total_bill' => 0,
            'dispatch_status' => 'pending',
        ]);

        $this->put("/food-orders/{$order->id}", [
            'customer_name' => 'jAMIE doe',
        ])->assertRedirect('/food-orders');

        $this->assertDatabaseHas('customers', [
            'id' => $customer->id,
            'customer_name' => 'JAMIE Doe',
        ]);
    }
}
