<?php

namespace App\Http\Controllers;

use App\Models\FoodOrder;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $activeStatuses = [
            'pending',
            'assigned',
            'preparing',
            'picked_up',
            'out_for_delivery',
        ];

        return Inertia::render('dashboard', [
            'stats' => [
                'totalOrders' => FoodOrder::count(),
                'activeOrders' => FoodOrder::whereIn('dispatch_status', $activeStatuses)->count(),
                'deliveredOrders' => FoodOrder::where('dispatch_status', 'delivered')->count(),
                'revenue' => FoodOrder::where('dispatch_status', 'delivered')->sum('total_bill'),
            ],
            'recentOrders' => FoodOrder::with([
                'customer:id,customer_name',
                'restaurant:id,restaurant_name',
            ])
                ->latest()
                ->limit(5)
                ->get([
                    'id',
                    'dispatch_id',
                    'customer_id',
                    'restaurant_id',
                    'total_bill',
                    'dispatch_status',
                    'created_at',
                ]),
        ]);
    }
}
