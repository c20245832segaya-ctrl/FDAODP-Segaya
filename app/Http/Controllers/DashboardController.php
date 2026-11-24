<?php

namespace App\Http\Controllers;

use App\Services\FoodOrderService; // Make sure this is imported
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(FoodOrderService $foodOrderService): Response
    {
        // Pass the data from the service directly to Inertia
        return Inertia::render('dashboard', $foodOrderService->getDashboardStats());
    }
}