import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material';
import type { ProjectIcon } from '../projectAppearance';
import {
  BlanketIcon, GarmentIcon, HatIcon, MittensIcon, ScarfIcon, ShawlIcon, SocksIcon, SweaterIcon, ToyIcon, VestIcon,
} from './knitIcons';

export const PROJECT_ICON_COMPONENT: Record<ProjectIcon, ComponentType<SvgIconProps>> = {
  garment: GarmentIcon,
  sweater: SweaterIcon,
  vest: VestIcon,
  hat: HatIcon,
  scarf: ScarfIcon,
  shawl: ShawlIcon,
  socks: SocksIcon,
  mittens: MittensIcon,
  blanket: BlanketIcon,
  toy: ToyIcon,
};
