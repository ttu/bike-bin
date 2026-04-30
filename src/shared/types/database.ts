export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      bike_photos: {
        Row: {
          bike_id: string;
          created_at: string;
          id: string;
          sort_order: number;
          storage_path: string;
        };
        Insert: {
          bike_id: string;
          created_at?: string;
          id?: string;
          sort_order?: number;
          storage_path: string;
        };
        Update: {
          bike_id?: string;
          created_at?: string;
          id?: string;
          sort_order?: number;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bike_photos_bike_id_fkey';
            columns: ['bike_id'];
            isOneToOne: false;
            referencedRelation: 'bikes';
            referencedColumns: ['id'];
          },
        ];
      };
      bikes: {
        Row: {
          brand: string | null;
          condition: Database['public']['Enums']['item_condition'];
          created_at: string;
          distance_km: number | null;
          id: string;
          model: string | null;
          name: string;
          notes: string | null;
          owner_id: string;
          type: Database['public']['Enums']['bike_type'];
          updated_at: string;
          usage_hours: number | null;
          year: number | null;
        };
        Insert: {
          brand?: string | null;
          condition?: Database['public']['Enums']['item_condition'];
          created_at?: string;
          distance_km?: number | null;
          id?: string;
          model?: string | null;
          name: string;
          notes?: string | null;
          owner_id: string;
          type?: Database['public']['Enums']['bike_type'];
          updated_at?: string;
          usage_hours?: number | null;
          year?: number | null;
        };
        Update: {
          brand?: string | null;
          condition?: Database['public']['Enums']['item_condition'];
          created_at?: string;
          distance_km?: number | null;
          id?: string;
          model?: string | null;
          name?: string;
          notes?: string | null;
          owner_id?: string;
          type?: Database['public']['Enums']['bike_type'];
          updated_at?: string;
          usage_hours?: number | null;
          year?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'bikes_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bikes_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'public_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      blocked_oauth_identities: {
        Row: {
          created_at: string;
          id: string;
          notes: string | null;
          provider: string;
          provider_user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          provider: string;
          provider_user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          provider?: string;
          provider_user_id?: string;
        };
        Relationships: [];
      };
      borrow_requests: {
        Row: {
          acted_by: string | null;
          created_at: string;
          group_id: string | null;
          id: string;
          item_id: string;
          message: string | null;
          owner_id: string | null;
          requester_id: string;
          status: Database['public']['Enums']['borrow_request_status'];
          updated_at: string;
        };
        Insert: {
          acted_by?: string | null;
          created_at?: string;
          group_id?: string | null;
          id?: string;
          item_id: string;
          message?: string | null;
          owner_id?: string | null;
          requester_id: string;
          status?: Database['public']['Enums']['borrow_request_status'];
          updated_at?: string;
        };
        Update: {
          acted_by?: string | null;
          created_at?: string;
          group_id?: string | null;
          id?: string;
          item_id?: string;
          message?: string | null;
          owner_id?: string | null;
          requester_id?: string;
          status?: Database['public']['Enums']['borrow_request_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'borrow_requests_item_id_fkey';
            columns: ['item_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'borrow_requests_requester_id_fkey';
            columns: ['requester_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'borrow_requests_requester_id_fkey';
            columns: ['requester_id'];
            isOneToOne: false;
            referencedRelation: 'public_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      conversation_participants: {
        Row: {
          conversation_id: string;
          last_read_at: string;
          user_id: string;
        };
        Insert: {
          conversation_id: string;
          last_read_at?: string;
          user_id: string;
        };
        Update: {
          conversation_id?: string;
          last_read_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversation_participants_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversation_participants_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversation_participants_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'public_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      conversations: {
        Row: {
          created_at: string;
          id: string;
          item_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          item_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_item_id_fkey';
            columns: ['item_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id'];
          },
        ];
      };
      export_requests: {
        Row: {
          created_at: string;
          error_message: string | null;
          expires_at: string | null;
          id: string;
          status: Database['public']['Enums']['export_request_status'];
          storage_path: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          expires_at?: string | null;
          id?: string;
          status?: Database['public']['Enums']['export_request_status'];
          storage_path?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          expires_at?: string | null;
          id?: string;
          status?: Database['public']['Enums']['export_request_status'];
          storage_path?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'export_requests_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'export_requests_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'public_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      geocode_cache: {
        Row: {
          area_name: string;
          cached_at: string | null;
          country: string;
          lat: number;
          lng: number;
          postcode: string;
        };
        Insert: {
          area_name: string;
          cached_at?: string | null;
          country?: string;
          lat: number;
          lng: number;
          postcode: string;
        };
        Update: {
          area_name?: string;
          cached_at?: string | null;
          country?: string;
          lat?: number;
          lng?: number;
          postcode?: string;
        };
        Relationships: [];
      };
      group_invitations: {
        Row: {
          id: string;
          group_id: string;
          invitee_user_id: string;
          inviter_user_id: string | null;
          status: Database['public']['Enums']['group_invitation_status'];
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          invitee_user_id: string;
          inviter_user_id?: string | null;
          status?: Database['public']['Enums']['group_invitation_status'];
          created_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          group_id?: string;
          invitee_user_id?: string;
          inviter_user_id?: string | null;
          status?: Database['public']['Enums']['group_invitation_status'];
          created_at?: string;
          responded_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'group_invitations_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_invitations_invitee_user_id_fkey';
            columns: ['invitee_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_invitations_inviter_user_id_fkey';
            columns: ['inviter_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      group_members: {
        Row: {
          group_id: string;
          joined_at: string;
          role: Database['public']['Enums']['group_role'];
          user_id: string;
        };
        Insert: {
          group_id: string;
          joined_at?: string;
          role?: Database['public']['Enums']['group_role'];
          user_id: string;
        };
        Update: {
          group_id?: string;
          joined_at?: string;
          role?: Database['public']['Enums']['group_role'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'public_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      groups: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_public: boolean;
          name: string;
          rating_avg: number;
          rating_count: number;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_public?: boolean;
          name: string;
          rating_avg?: number;
          rating_count?: number;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_public?: boolean;
          name?: string;
          rating_avg?: number;
          rating_count?: number;
        };
        Relationships: [];
      };
      item_groups: {
        Row: {
          group_id: string;
          item_id: string;
        };
        Insert: {
          group_id: string;
          item_id: string;
        };
        Update: {
          group_id?: string;
          item_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'item_groups_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'item_groups_item_id_fkey';
            columns: ['item_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id'];
          },
        ];
      };
      item_photos: {
        Row: {
          created_at: string;
          id: string;
          item_id: string;
          sort_order: number;
          storage_path: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          item_id: string;
          sort_order?: number;
          storage_path: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_id?: string;
          sort_order?: number;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'item_photos_item_id_fkey';
            columns: ['item_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id'];
          },
        ];
      };
      items: {
        Row: {
          age: string | null;
          availability_types: string[] | null;
          bike_id: string | null;
          borrow_duration: string | null;
          brand: string | null;
          category: Database['public']['Enums']['item_category'];
          condition: Database['public']['Enums']['item_condition'];
          created_at: string;
          created_by: string | null;
          deposit: number | null;
          description: string | null;
          group_id: string | null;
          id: string;
          model: string | null;
          mounted_date: string | null;
          name: string;
          owner_id: string | null;
          pickup_location_id: string | null;
          price: number | null;
          purchase_date: string | null;
          quantity: number;
          remaining_fraction: number | null;
          status: Database['public']['Enums']['item_status'];
          storage_location: string | null;
          subcategory: string | null;
          tags: string[];
          updated_at: string;
          usage_km: number | null;
          visibility: Database['public']['Enums']['item_visibility'];
        };
        Insert: {
          age?: string | null;
          availability_types?: string[] | null;
          bike_id?: string | null;
          borrow_duration?: string | null;
          brand?: string | null;
          category: Database['public']['Enums']['item_category'];
          condition?: Database['public']['Enums']['item_condition'];
          created_at?: string;
          created_by?: string | null;
          deposit?: number | null;
          description?: string | null;
          group_id?: string | null;
          id?: string;
          model?: string | null;
          mounted_date?: string | null;
          name: string;
          owner_id?: string | null;
          pickup_location_id?: string | null;
          price?: number | null;
          purchase_date?: string | null;
          quantity?: number;
          remaining_fraction?: number | null;
          status?: Database['public']['Enums']['item_status'];
          storage_location?: string | null;
          subcategory?: string | null;
          tags?: string[];
          updated_at?: string;
          usage_km?: number | null;
          visibility?: Database['public']['Enums']['item_visibility'];
        };
        Update: {
          age?: string | null;
          availability_types?: string[] | null;
          bike_id?: string | null;
          borrow_duration?: string | null;
          brand?: string | null;
          category?: Database['public']['Enums']['item_category'];
          condition?: Database['public']['Enums']['item_condition'];
          created_at?: string;
          created_by?: string | null;
          deposit?: number | null;
          description?: string | null;
          group_id?: string | null;
          id?: string;
          model?: string | null;
          mounted_date?: string | null;
          name?: string;
          owner_id?: string | null;
          pickup_location_id?: string | null;
          price?: number | null;
          purchase_date?: string | null;
          quantity?: number;
          remaining_fraction?: number | null;
          status?: Database['public']['Enums']['item_status'];
          storage_location?: string | null;
          subcategory?: string | null;
          tags?: string[];
          updated_at?: string;
          usage_km?: number | null;
          visibility?: Database['public']['Enums']['item_visibility'];
        };
        Relationships: [
          {
            foreignKeyName: 'items_bike_id_fkey';
            columns: ['bike_id'];
            isOneToOne: false;
            referencedRelation: 'bikes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'items_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'items_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'items_pickup_location_id_fkey';
            columns: ['pickup_location_id'];
            isOneToOne: false;
            referencedRelation: 'saved_locations';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          body: string;
          conversation_id: string;
          created_at: string;
          id: string;
          sender_id: string | null;
        };
        Insert: {
          body: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          sender_id?: string | null;
        };
        Update: {
          body?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          sender_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'public_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      moderation_enforcement_log: {
        Row: {
          created_at: string;
          id: string;
          performed_by: string;
          reason: string | null;
          report_ids: string[] | null;
          sanctioned_user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          performed_by?: string;
          reason?: string | null;
          report_ids?: string[] | null;
          sanctioned_user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          performed_by?: string;
          reason?: string | null;
          report_ids?: string[] | null;
          sanctioned_user_id?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          data: Json | null;
          id: string;
          is_read: boolean;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          data?: Json | null;
          id?: string;
          is_read?: boolean;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          data?: Json | null;
          id?: string;
          is_read?: boolean;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'public_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          distance_unit: string;
          id: string;
          notification_preferences: Json | null;
          push_token: string | null;
          rating_avg: number | null;
          rating_count: number | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          distance_unit?: string;
          id: string;
          notification_preferences?: Json | null;
          push_token?: string | null;
          rating_avg?: number | null;
          rating_count?: number | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          distance_unit?: string;
          id?: string;
          notification_preferences?: Json | null;
          push_token?: string | null;
          rating_avg?: number | null;
          rating_count?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      ratings: {
        Row: {
          borrow_request_id: string;
          created_at: string;
          editable_until: string | null;
          from_user_id: string | null;
          id: string;
          item_id: string | null;
          score: number;
          text: string | null;
          to_group_id: string | null;
          to_user_id: string | null;
          transaction_type: Database['public']['Enums']['transaction_type'];
          updated_at: string;
        };
        Insert: {
          borrow_request_id: string;
          created_at?: string;
          editable_until?: string | null;
          from_user_id?: string | null;
          id?: string;
          item_id?: string | null;
          score: number;
          text?: string | null;
          to_group_id?: string | null;
          to_user_id?: string | null;
          transaction_type: Database['public']['Enums']['transaction_type'];
          updated_at?: string;
        };
        Update: {
          borrow_request_id?: string;
          created_at?: string;
          editable_until?: string | null;
          from_user_id?: string | null;
          id?: string;
          item_id?: string | null;
          score?: number;
          text?: string | null;
          to_group_id?: string | null;
          to_user_id?: string | null;
          transaction_type?: Database['public']['Enums']['transaction_type'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ratings_from_user_id_fkey';
            columns: ['from_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ratings_from_user_id_fkey';
            columns: ['from_user_id'];
            isOneToOne: false;
            referencedRelation: 'public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ratings_item_id_fkey';
            columns: ['item_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ratings_to_user_id_fkey';
            columns: ['to_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ratings_to_user_id_fkey';
            columns: ['to_user_id'];
            isOneToOne: false;
            referencedRelation: 'public_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      reports: {
        Row: {
          created_at: string;
          id: string;
          reason: string;
          reporter_id: string;
          status: Database['public']['Enums']['report_status'];
          target_id: string;
          target_type: Database['public']['Enums']['report_target_type'];
          text: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          reason: string;
          reporter_id: string;
          status?: Database['public']['Enums']['report_status'];
          target_id: string;
          target_type: Database['public']['Enums']['report_target_type'];
          text?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          reason?: string;
          reporter_id?: string;
          status?: Database['public']['Enums']['report_status'];
          target_id?: string;
          target_type?: Database['public']['Enums']['report_target_type'];
          text?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reports_reporter_id_fkey';
            columns: ['reporter_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_reporter_id_fkey';
            columns: ['reporter_id'];
            isOneToOne: false;
            referencedRelation: 'public_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      saved_locations: {
        Row: {
          area_name: string | null;
          coordinates: unknown;
          created_at: string;
          id: string;
          is_primary: boolean;
          label: string;
          postcode: string | null;
          user_id: string;
        };
        Insert: {
          area_name?: string | null;
          coordinates?: unknown;
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          label: string;
          postcode?: string | null;
          user_id: string;
        };
        Update: {
          area_name?: string | null;
          coordinates?: unknown;
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          label?: string;
          postcode?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'saved_locations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'saved_locations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'public_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          created_at: string;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          metadata: Json;
          plan: Database['public']['Enums']['subscription_plan'];
          provider: string | null;
          provider_customer_id: string | null;
          provider_subscription_id: string | null;
          status: Database['public']['Enums']['subscription_status'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          metadata?: Json;
          plan: Database['public']['Enums']['subscription_plan'];
          provider?: string | null;
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          status?: Database['public']['Enums']['subscription_status'];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          metadata?: Json;
          plan?: Database['public']['Enums']['subscription_plan'];
          provider?: string | null;
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          status?: Database['public']['Enums']['subscription_status'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'public_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      support_requests: {
        Row: {
          app_version: string | null;
          body: string;
          created_at: string;
          device_info: string | null;
          email: string | null;
          id: string;
          screenshot_path: string | null;
          status: Database['public']['Enums']['support_status'];
          subject: string;
          user_id: string | null;
        };
        Insert: {
          app_version?: string | null;
          body: string;
          created_at?: string;
          device_info?: string | null;
          email?: string | null;
          id?: string;
          screenshot_path?: string | null;
          status?: Database['public']['Enums']['support_status'];
          subject: string;
          user_id?: string | null;
        };
        Update: {
          app_version?: string | null;
          body?: string;
          created_at?: string;
          device_info?: string | null;
          email?: string | null;
          id?: string;
          screenshot_path?: string | null;
          status?: Database['public']['Enums']['support_status'];
          subject?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'support_requests_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'support_requests_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'public_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          display_name: string | null;
          id: string | null;
          rating_avg: number | null;
          rating_count: number | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          id?: string | null;
          rating_avg?: number | null;
          rating_count?: number | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          id?: string | null;
          rating_avg?: number | null;
          rating_count?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      accept_group_invitation: {
        Args: { p_invitation_id: string };
        Returns: undefined;
      };
      can_see_item: {
        Args: { p_item_id: string; p_user_id: string };
        Returns: boolean;
      };
      check_blocked_identity: { Args: { event: Json }; Returns: Json };
      conversation_has_no_participants: {
        Args: { p_conversation_id: string };
        Returns: boolean;
      };
      find_empty_conversations: {
        Args: never;
        Returns: {
          id: string;
        }[];
      };
      get_listing_detail: {
        Args: { p_item_id: string };
        Returns: {
          area_name: string;
          availability_types: string[];
          borrow_duration: string;
          brand: string;
          category: Database['public']['Enums']['item_category'];
          condition: Database['public']['Enums']['item_condition'];
          created_at: string;
          deposit: number;
          description: string;
          distance_meters: number;
          group_id: string | null;
          group_name: string | null;
          group_rating_avg: number;
          group_rating_count: number;
          id: string;
          model: string;
          name: string;
          owner_avatar_url: string;
          owner_display_name: string;
          owner_id: string;
          owner_rating_avg: number;
          owner_rating_count: number;
          pickup_location_id: string;
          price: number;
          quantity: number;
          status: Database['public']['Enums']['item_status'];
          updated_at: string;
          visibility: Database['public']['Enums']['item_visibility'];
        }[];
      };
      get_public_profile: {
        Args: { p_user_id: string };
        Returns: {
          avatar_url: string;
          created_at: string;
          display_name: string;
          id: string;
          rating_avg: number;
          rating_count: number;
        }[];
      };
      get_public_profiles: {
        Args: { p_user_ids: string[] };
        Returns: {
          avatar_url: string;
          created_at: string;
          display_name: string;
          id: string;
          rating_avg: number;
          rating_count: number;
        }[];
      };
      get_group_members_with_profiles: {
        Args: { p_group_id: string };
        Returns: {
          group_id: string;
          user_id: string;
          role: string;
          joined_at: string;
          display_name: string | null;
          avatar_url: string | null;
        }[];
      };
      get_user_tags: { Args: never; Returns: string[] };
      get_my_bike_limit: { Args: never; Returns: number };
      get_my_inventory_item_limit: { Args: never; Returns: number };
      get_my_photo_count: { Args: never; Returns: number };
      get_my_photo_limit: { Args: never; Returns: number };
      gettransactionid: { Args: never; Returns: unknown };
      is_conversation_participant: {
        Args: { p_conversation_id: string; p_user_id: string };
        Returns: boolean;
      };
      is_group_admin: {
        Args: { p_group_id: string; p_user_id: string };
        Returns: boolean;
      };
      is_group_member: {
        Args: { p_group_id: string; p_user_id: string };
        Returns: boolean;
      };
      is_public_group: { Args: { p_group_id: string }; Returns: boolean };
      mark_conversation_read: {
        Args: { p_conversation_id: string };
        Returns: undefined;
      };
      unread_message_count: {
        Args: never;
        Returns: {
          conversation_id: string;
          count: number;
        }[];
      };
      latest_messages_for_conversations: {
        Args: { p_conversation_ids: string[] };
        Returns: {
          body: string;
          conversation_id: string;
          created_at: string;
          sender_id: string;
        }[];
      };
      primary_photos_for_items: {
        Args: { p_item_ids: string[] };
        Returns: {
          item_id: string;
          storage_path: string;
        }[];
      };
      recalc_group_rating_aggregate: {
        Args: { target_group_id: string };
        Returns: undefined;
      };
      recalc_user_rating_aggregate: {
        Args: { target_user_id: string };
        Returns: undefined;
      };
      search_nearby_items: {
        Args: {
          lat?: number;
          lng?: number;
          max_distance_meters?: number;
          p_categories?: Database['public']['Enums']['item_category'][];
          p_conditions?: Database['public']['Enums']['item_condition'][];
          p_limit?: number;
          p_offset?: number;
          p_status?: Database['public']['Enums']['item_status'];
          query?: string;
        };
        Returns: {
          availability_types: string[];
          borrow_duration: string;
          brand: string;
          category: Database['public']['Enums']['item_category'];
          condition: Database['public']['Enums']['item_condition'];
          created_at: string;
          deposit: number;
          description: string;
          distance_meters: number;
          id: string;
          model: string;
          name: string;
          owner_id: string;
          pickup_location_id: string;
          price: number;
          quantity: number;
          status: Database['public']['Enums']['item_status'];
          updated_at: string;
          visibility: Database['public']['Enums']['item_visibility'];
        }[];
      };
      search_invitable_users: {
        Args: { p_group_id: string; p_query: string; p_limit?: number };
        Returns: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
        }[];
      };
      transfer_item_ownership: {
        Args: {
          p_item_id: string;
          p_to_group_id?: string;
          p_to_owner_id?: string;
        };
        Returns: undefined;
      };
      transition_borrow_request: {
        Args: {
          p_new_item_status: string;
          p_new_request_status: string;
          p_request_id: string;
        };
        Returns: Json;
      };
      user_shares_group_with_item: {
        Args: { p_item_id: string; p_user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      bike_type:
        | 'road'
        | 'gravel'
        | 'mtb'
        | 'cyclo'
        | 'enduro'
        | 'xc'
        | 'downhill'
        | 'bmx'
        | 'fatbike'
        | 'city'
        | 'touring'
        | 'other';
      borrow_request_status: 'pending' | 'accepted' | 'rejected' | 'returned' | 'cancelled';
      export_request_status: 'pending' | 'processing' | 'completed' | 'failed';
      group_invitation_status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
      group_role: 'admin' | 'member';
      item_category: 'component' | 'tool' | 'accessory' | 'consumable' | 'clothing' | 'bike';
      item_condition: 'new' | 'good' | 'worn' | 'broken';
      item_status: 'stored' | 'mounted' | 'loaned' | 'reserved' | 'donated' | 'sold' | 'archived';
      item_visibility: 'private' | 'groups' | 'all';
      report_status: 'open' | 'reviewed' | 'closed';
      report_target_type: 'item' | 'user' | 'item_photo' | 'message';
      subscription_plan: 'free' | 'paid';
      subscription_status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
      support_status: 'open' | 'closed';
      transaction_type: 'borrow' | 'donate' | 'sell';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

// NOSONAR: Supabase helper — default `CompositeTypeName` and conditional branch use `never` for inference; removing it breaks generated client typings.
export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      bike_type: [
        'road',
        'gravel',
        'mtb',
        'cyclo',
        'enduro',
        'xc',
        'downhill',
        'bmx',
        'fatbike',
        'city',
        'touring',
        'other',
      ],
      borrow_request_status: ['pending', 'accepted', 'rejected', 'returned', 'cancelled'],
      export_request_status: ['pending', 'processing', 'completed', 'failed'],
      group_invitation_status: ['pending', 'accepted', 'rejected', 'cancelled'],
      group_role: ['admin', 'member'],
      item_category: ['component', 'tool', 'accessory', 'consumable', 'clothing', 'bike'],
      item_condition: ['new', 'good', 'worn', 'broken'],
      item_status: ['stored', 'mounted', 'loaned', 'reserved', 'donated', 'sold', 'archived'],
      item_visibility: ['private', 'groups', 'all'],
      report_status: ['open', 'reviewed', 'closed'],
      report_target_type: ['item', 'user', 'item_photo', 'message'],
      subscription_plan: ['free', 'paid'],
      subscription_status: ['trialing', 'active', 'past_due', 'canceled', 'expired'],
      support_status: ['open', 'closed'],
      transaction_type: ['borrow', 'donate', 'sell'],
    },
  },
} as const;
