

function get_palette_data(palette_str){

  console.log("USING EXT")
  var colormap;
  if (palette_str == "gamma") 
    colormap = gamma_colormap;
  else if (palette_str == "rich") 
    colormap = rich_colormap;
  else if (palette_str == "smoothrich") 
    colormap = smoothrich_colormap;
  else if (palette_str == "banded") 
    colormap = banded_colormap;
  else if (palette_str == "bry") 
    colormap = bry_colormap;
  else if (palette_str == "bgry") 
      colormap = bgry_colormap;
  else if (palette_str == "hot1") 
      colormap = hot1_colormap;
  else if (palette_str == "hot2") 
      colormap = hot2_colormap;
  else if (palette_str == "ice") 
      colormap = ice_colormap;
  else if (palette_str == "lighthues") 
      colormap = lighthues_colormap;
  else if (palette_str == "lut16") 
      colormap = lut16_colormap;
  else if (palette_str == "BlueGreenDivergent") 
    colormap = BlueGreenDivergent_colormap;
  else if (palette_str == "GreenGold") 
    colormap = GreenGold_colormap;
  else if (palette_str == "LinearGreen") 
    colormap = LinearGreen_colormap;
  else if (palette_str == "AsymmetricBlueGreenDivergent") 
    colormap = AsymmetricBlueGreenDivergent_colormap;
  else if (palette_str == "LinearTurquois") 
    colormap = LinearTurquois_colormap;
  else if (palette_str == "MutedBlueGreen") 
    colormap = MutedBlueGreen_colormap;
  else if (palette_str == "ExtendedCoolWarm") 
    colormap = ExtendedCoolWarm_colormap;
  else if (palette_str == "AsymmetricBlueOrangeDivergent") 
    colormap = AsymmetricBlueOrangeDivergent_colormap;
  else if (palette_str == "LinearYellow") 
    colormap = LinearYellow_colormap;
  else if (palette_str == "LinearGray5") 
    colormap = LinearGray5_colormap;
  else if (palette_str == "LinearGray4") 
    colormap = LinearGray4_colormap;
  else if (palette_str == "graytransparent") 
    colormap = hsv_colormap;//gray_transparent_colormap();
  else if (palette_str == "grayopaque") 
    colormap = gray_opaque_colormap();
  else if (palette_str == "hsl") 
    colormap = hsv_colormap;//hsl_colormap();
  else if (palette_str == 'scivis_0_20_green_inset')
colormap=scivis_0_20_green_inset;
else if (palette_str == 'scivis_20_40_green_inset')
colormap=scivis_20_40_green_inset;
else if (palette_str == 'scivis_3W_muted_a01')
colormap=scivis_3W_muted_a01;
else if (palette_str == 'scivis_3Wbgy')
colormap=scivis_3Wbgy;
else if (palette_str == 'scivis_3Wbgy5')
colormap=scivis_3Wbgy5;
else if (palette_str == 'scivis_4_discrete_blue_green')
colormap=scivis_4_discrete_blue_green;
else if (palette_str == 'scivis_4_section_blue_orange')
colormap=scivis_4_section_blue_orange;
else if (palette_str == 'scivis_4_section_discrete_vanEyck')
colormap=scivis_4_section_discrete_vanEyck;
else if (palette_str == 'scivis_4_section_light_autumn')
colormap=scivis_4_section_light_autumn;
else if (palette_str == 'scivis_40_60_green_inset')
colormap=scivis_40_60_green_inset;
else if (palette_str == 'scivis_5_discrete_gr_ye_rd_dark')
colormap=scivis_5_discrete_gr_ye_rd_dark;
else if (palette_str == 'scivis_5_section_muted_autumn')
colormap=scivis_5_section_muted_autumn;
else if (palette_str == 'scivis_5_step_melow_wave')
colormap=scivis_5_step_melow_wave;
else if (palette_str == 'scivis_5_wave_mgreen_green_blue_mblue_gray')
colormap=scivis_5_wave_mgreen_green_blue_mblue_gray;
else if (palette_str == 'scivis_5_wave_orange_to_green')
colormap=scivis_5_wave_orange_to_green;
else if (palette_str == 'scivis_5_wave_violet_to_blue')
colormap=scivis_5_wave_violet_to_blue;
else if (palette_str == 'scivis_5_wave_yellow_green')
colormap=scivis_5_wave_yellow_green;
else if (palette_str == 'scivis_5_wave_yellow_red_green')
colormap=scivis_5_wave_yellow_red_green;
else if (palette_str == 'scivis_5_wave_yellow_to_blue')
colormap=scivis_5_wave_yellow_to_blue;
else if (palette_str == 'scivis_5wave_yellow_red_brown_gold_green')
colormap=scivis_5wave_yellow_red_brown_gold_green;
else if (palette_str == 'scivis_5wave_yellow_to_blue')
colormap=scivis_5wave_yellow_to_blue;
else if (palette_str == 'scivis_60_80_green_inset')
colormap=scivis_60_80_green_inset;
else if (palette_str == 'scivis_7_section_muted')
colormap=scivis_7_section_muted;
else if (palette_str == 'scivis_80_100_green_inset')
colormap=scivis_80_100_green_inset;
else if (palette_str == 'scivis_asym_orange_blue')
colormap=scivis_asym_orange_blue;
else if (palette_str == 'scivis_blue_1')
colormap=scivis_blue_1;
else if (palette_str == 'scivis_blue_10')
colormap=scivis_blue_10;
else if (palette_str == 'scivis_blue_11')
colormap=scivis_blue_11;
else if (palette_str == 'scivis_blue_2')
colormap=scivis_blue_2;
else if (palette_str == 'scivis_blue_3')
colormap=scivis_blue_3;
else if (palette_str == 'scivis_blue_5')
colormap=scivis_blue_5;
else if (palette_str == 'scivis_blue_6')
colormap=scivis_blue_6;
else if (palette_str == 'scivis_blue_7')
colormap=scivis_blue_7;
else if (palette_str == 'scivis_blue_8')
colormap=scivis_blue_8;
else if (palette_str == 'scivis_blue_9')
colormap=scivis_blue_9;
else if (palette_str == 'scivis_blue_green_sat_on_ends')
colormap=scivis_blue_green_sat_on_ends;
else if (palette_str == 'scivis_blue_green_yellow_orange')
colormap=scivis_blue_green_yellow_orange;
else if (palette_str == 'scivis_blue_orange_div')
colormap=scivis_blue_orange_div;
else if (palette_str == 'scivis_brown_1')
colormap=scivis_brown_1;
else if (palette_str == 'scivis_brown_2')
colormap=scivis_brown_2;
else if (palette_str == 'scivis_brown_3')
colormap=scivis_brown_3;
else if (palette_str == 'scivis_brown_4')
colormap=scivis_brown_4;
else if (palette_str == 'scivis_brown_5')
colormap=scivis_brown_5;
else if (palette_str == 'scivis_brown_6')
colormap=scivis_brown_6;
else if (palette_str == 'scivis_brown_7')
colormap=scivis_brown_7;
else if (palette_str == 'scivis_brown_8')
colormap=scivis_brown_8;
else if (palette_str == 'scivis_brown_9')
colormap=scivis_brown_9;
else if (palette_str == 'scivis_FloatPNG_PV44')
colormap=scivis_FloatPNG_PV44;
else if (palette_str == 'scivis_gray_gold')
colormap=scivis_gray_gold;
else if (palette_str == 'scivis_green_1')
colormap=scivis_green_1;
else if (palette_str == 'scivis_green_2')
colormap=scivis_green_2;
else if (palette_str == 'scivis_green_3')
colormap=scivis_green_3;
else if (palette_str == 'scivis_green_4')
colormap=scivis_green_4;
else if (palette_str == 'scivis_green_5')
colormap=scivis_green_5;
else if (palette_str == 'scivis_green_7')
colormap=scivis_green_7;
else if (palette_str == 'scivis_green_8')
colormap=scivis_green_8;
else if (palette_str == 'scivis_green_brown_div')
colormap=scivis_green_brown_div;
else if (palette_str == 'scivis_green_brown_red_yellow')
colormap=scivis_green_brown_red_yellow;
else if (palette_str == 'scivis_maroon_5')
colormap=scivis_maroon_5;
else if (palette_str == 'scivis_mellow_rainbow')
colormap=scivis_mellow_rainbow;
else if (palette_str == 'scivis_not_blue_4')
colormap=scivis_not_blue_4;
else if (palette_str == 'scivis_not_green_6')
colormap=scivis_not_green_6;
else if (palette_str == 'scivis_orange_4')
colormap=scivis_orange_4;
else if (palette_str == 'scivis_orange_5')
colormap=scivis_orange_5;
else if (palette_str == 'scivis_orange_6')
colormap=scivis_orange_6;
else if (palette_str == 'scivis_orange_green_blue_gray')
colormap=scivis_orange_green_blue_gray;
else if (palette_str == 'scivis_orange_turquoise_div_inset')
colormap=scivis_orange_turquoise_div_inset;
else if (palette_str == 'scivis_pale_sat_blue_rainbow')
colormap=scivis_pale_sat_blue_rainbow;
else if (palette_str == 'scivis_purple_6')
colormap=scivis_purple_6;
else if (palette_str == 'scivis_purple_7')
colormap=scivis_purple_7;
else if (palette_str == 'scivis_purple_8')
colormap=scivis_purple_8;
else if (palette_str == 'scivis_red_1')
colormap=scivis_red_1;
else if (palette_str == 'scivis_red_2')
colormap=scivis_red_2;
else if (palette_str == 'scivis_red_3')
colormap=scivis_red_3;
else if (palette_str == 'scivis_red_4')
colormap=scivis_red_4;
else if (palette_str == 'scivis_red_brown_yellow_green')
colormap=scivis_red_brown_yellow_green;
else if (palette_str == 'scivis_sawtooth_blue_green_gold')
colormap=scivis_sawtooth_blue_green_gold;
else if (palette_str == 'scivis_turqoise_olive')
colormap=scivis_turqoise_olive;
else if (palette_str == 'scivis_yellow_1')
colormap=scivis_yellow_1;
else if (palette_str == 'scivis_yellow_2')
colormap=scivis_yellow_2;
else if (palette_str == 'scivis_yellow_3')
colormap=scivis_yellow_3;
else if (palette_str == 'scivis_yellow_7')
colormap=scivis_yellow_7;
else if (palette_str == 'scivis_yellow_8')
colormap=scivis_yellow_8;
else if (palette_str == 'scivis_yellow_teal_green_brown')
colormap=scivis_yellow_teal_green_brown;
  else 
    colormap = smoothrich_colormap;

  return colormap;

}