
import React from 'react';

export interface Product {
  id: string;
  name: string;
  category: 'racao' | 'brinquedo' | 'acessorio' | 'higiene';
  price: number;
  imageUrl: string;
  petType: 'cao' | 'gato' | 'outros';
  description: string;
  assignedPet?: string;
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
  userId: string;
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

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  assignedPet?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}
