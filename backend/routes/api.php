<?php

use App\Http\Controllers\CommercialPerformanceController;
use App\Http\Controllers\DataController;
use Illuminate\Support\Facades\Route;

Route::post('/data', DataController::class)->middleware('internal');
Route::get('/commerciaux/performance', CommercialPerformanceController::class)->middleware('internal');
