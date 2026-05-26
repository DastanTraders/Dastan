<?php
/**
 * Plugin Name:  Dastan Signature Scroll
 * Description:  Animates a cursive "Dastan" signature that draws itself as
 *               visitors scroll the page, with the ink trail looping elegantly
 *               around every headline it encounters.
 * Version:      1.0.0
 * Author:       Dastan
 * Text Domain:  dastan-signature-scroll
 * License:      GPL-2.0-or-later
 */

defined( 'ABSPATH' ) || exit;

add_action( 'wp_enqueue_scripts', 'dss_enqueue_assets' );

function dss_enqueue_assets() {
    $base = plugin_dir_url( __FILE__ );
    $ver  = '1.0.0';

    wp_enqueue_style(
        'dastan-signature-scroll',
        $base . 'css/signature.css',
        [],
        $ver
    );

    wp_enqueue_script(
        'dastan-signature-scroll',
        $base . 'js/signature.js',
        [],     // no jQuery dependency — pure ES5
        $ver,
        true    // load in footer so DOM is ready
    );

    // Pass PHP settings to JS (theme colour can be filtered)
    $settings = apply_filters( 'dss_settings', [
        'strokeColor'      => '#c8a96e',   // warm gold – matches Dastan.uk palette
        'strokeWidth'      => 2,
        'glowColor'        => 'rgba(200,169,110,0.35)',
        'circleMargin'     => 28,
        'headlineSelector' => 'h1, h2, h3',
        'initialReveal'    => 0.06,        // fraction of path shown before scroll
    ] );

    wp_localize_script( 'dastan-signature-scroll', 'dssSettings', $settings );
}
