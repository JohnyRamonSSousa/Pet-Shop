
import React from 'react';

export interface Product {
  id: string;
  name: string;
  category: 'racao' | 'brinquedo' | 'acessorio' | 'higiene';
  price: number;
  imageUrl: string;
  petType: 'cao' | 'gato' | 'outros';
  description: string;
}

export interface PetService {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  price?: string;
}

export interface Appointment {
  id: string;
  date: string;
  time: string;
  type: string;
  petName: string;
  status: 'pending' | 'confirmed' | 'completed';
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  pets: { name: string; breed: string; type: string }[];
}
