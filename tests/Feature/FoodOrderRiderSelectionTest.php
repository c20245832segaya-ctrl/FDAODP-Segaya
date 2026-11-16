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

    public function test_create_form_lists_all_riders(): void
    {
        $this->actingAs(User::factory()->create());

        $availableRider = Rider::create(['rider_name' => 'Available Rider', 'is_available' => true]);
        $unavailableRider = Rider::create(['rider_name' => 'Unavailable Rider', 'is_available' => false]);

        $this->get('/food-orders/create')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('food-orders/create')
                ->has('riders', 2)
                ->where('riders.0.id', $availableRider->id)
                ->where('riders.0.rider_name', 'Available Rider')
                ->where('riders.1.id', $unavailableRider->id)
                ->where('riders.1.rider_name', 'Unavailable Rider'));
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

    public function test_customer_can_assign_or_unassign_a_rider_when_updating_an_order(): void
    {
        $this->actingAs(User::factory()->create());

        $this->post('/food-orders', $this->orderData('FD-UPDATE-RIDER', null))
            ->assertRedirect('/food-orders');

        $order = FoodOrder::where('dispatch_id', 'FD-UPDATE-RIDER')->firstOrFail();
        $rider = Rider::create(['rider_name' => 'Selected Rider', 'is_available' => true]);

        $this->put("/food-orders/{$order->id}", ['rider_id' => $rider->id])
            ->assertRedirect('/food-orders');

        $this->assertSame($rider->id, $order->fresh()->rider_id);

        $this->put("/food-orders/{$order->id}", ['rider_id' => null])
            ->assertRedirect('/food-orders');

        $this->assertNull($order->fresh()->rider_id);
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
