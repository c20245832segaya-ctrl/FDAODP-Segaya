<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\FoodOrder;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $this->actingAs($user = User::factory()->create());

        $this->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('stats.totalOrders', 0)
                ->where('stats.activeOrders', 0)
                ->where('stats.deliveredOrders', 0)
                ->where('stats.revenue', 0)
                ->has('recentOrders', 0));
    }

    public function test_dashboard_shows_order_metrics_and_recent_orders()
    {
        $this->actingAs(User::factory()->create());

        $customer = Customer::create([
            'customer_name' => 'Jamie Doe',
            'delivery_address' => '1 Example Street',
        ]);
        $restaurant = Restaurant::create(['restaurant_name' => 'Example Kitchen']);

        FoodOrder::create([
            'dispatch_id' => 'FD-DELIVERED',
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'delivery_fee' => 50,
            'subtotal' => 250,
            'total_bill' => 300,
            'dispatch_status' => 'delivered',
        ]);
        FoodOrder::where('dispatch_id', 'FD-DELIVERED')
            ->update(['created_at' => now()->subDay()]);

        FoodOrder::create([
            'dispatch_id' => 'FD-ACTIVE',
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'delivery_fee' => 20,
            'subtotal' => 100,
            'total_bill' => 120,
            'dispatch_status' => 'preparing',
        ]);
        FoodOrder::where('dispatch_id', 'FD-ACTIVE')
            ->update(['created_at' => now()]);

        $this->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('stats.totalOrders', 2)
                ->where('stats.activeOrders', 1)
                ->where('stats.deliveredOrders', 1)
                ->where('stats.revenue', 300)
                ->has('recentOrders', 2)
                ->where('recentOrders.0.dispatch_id', 'FD-ACTIVE'));
    }
}
