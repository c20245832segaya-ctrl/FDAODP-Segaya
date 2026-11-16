<?php

namespace Database\Seeders;

use App\Models\Rider;
use Illuminate\Database\Seeder;

class RiderSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Jorey Caro', 'Arjay Salanap'] as $riderName) {
            Rider::firstOrCreate(
                ['rider_name' => $riderName],
                ['is_available' => true],
            );
        }
    }
}
