export interface Travel {
  no: number;
  name: string;
  address: string;
  latitude: string;
  longitude: number;
  type: string;
  type_no: string;
  tel: string;
  theme: string;
  has_parkinglot: string;
  parkinglot_count: number;
  homepage: string;
  description: string;
}

export interface TravelsResponse {
  namhae_travels: {
    items: Travel[];
  };
}
