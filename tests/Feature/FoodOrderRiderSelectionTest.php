<?php

namespace Tests\Feature;

use App\Models\FoodOrder;
use App\Models\Rider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FoodOrderRiderSelectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_form_lists_available_riders(): void
    {
        $this->actingAs(User::factory()->create());

        $availableRider = Rider::create(['rider_name' => 'Available Rider', 'is_available' => true]);
        Rider::create(['rider_name' => 'Unavailable Rider', 'is_available' => false]);

        $this->get('/food-orders/create')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('food-orders/create')
                ->has('availableRiders', 1)
                ->where('availableRiders.0.id', $availableRider->id)
                ->where('availableRiders.0.rider_name', 'Available Rider'));
    }

    public function test_customer_can_select_an_available_rider_or_receive_an_automatic_assignment(): void
    {
        $this->actingAs(User::factory()->create());

        $selectedRider = Rider::create(['rider_name' => 'Selected Rider', 'is_available' => true]);
        $automaticRider = Rider::create(['rider_name' => 'Automatic Rider', 'is_available' => true]);

        $this->post('/food-orders', $this->orderData('FD-SELECTED-RIDER', $selectedRider->id))
            ->assertRedirect('/food-orders');

        $this->assertSame(
            $selectedRider->id,
            FoodOrder::where('dispatch_id', 'FD-SELECTED-RIDER')->value('rider_id')
        );

        $selectedRider->update(['is_available' => false]);

        $this->post('/food-orders', $this->orderData('FD-AUTO-RIDER', null))
            ->assertRedirect('/food-orders');

        $this->assertSame(
            $automaticRider->id,
            FoodOrder::where('dispatch_id', 'FD-AUTO-RIDER')->value('rider_id')
        );
    }

    public function test_unavailable_riders_cannot_be_selected(): void
    {
        $this->actingAs(User::factory()->create());

        $unavailableRider = Rider::create(['rider_name' => 'Unavailable Rider', 'is_available' => false]);

        $this->from('/food-orders/create')
            ->post('/food-orders', $this->orderData('FD-UNAVAILABLE-RIDER', $unavailableRider->id))
            ->assertSessionHasErrors('rider_id');

        $this->assertDatabaseMissing('food_orders', ['dispatch_id' => 'FD-UNAVAILABLE-RIDER']);
    }

    private function orderData(string $dispatchId, ?int $riderId): array
    {
        return [
            'dispatch_id' => $dispatchId,
            'customer_name' => 'Jamie Doe',
            'delivery_address' => '1 Example Street',
            'restaurant_name' => 'Example Kitchen',
            'rider_id' => $riderId,
            'delivery_fee' => '10.00',
            'dispatch_status' => 'pending',
            'items' => [
                [
                    'menu_item_name' => 'Example meal',
                    'item_price' => '25.00',
                    'quantity' => 1,
                ],
            ],
        ];
    }
}
