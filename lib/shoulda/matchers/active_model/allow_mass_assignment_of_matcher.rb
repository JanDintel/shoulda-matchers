module Shoulda
  module Matchers
    module ActiveModel
      # The `allow_mass_assignment_of` matcher tests usage of Rails 3's
      # `attr_accessible` and `attr_protected` macros, asserting that an
      # attribute in your model is contained in either the whitelist or
      # blacklist and thus can or cannot be set via mass assignment.
      #
      # See {AllowMassAssignmentOfMatcher} for more.
      #
      def allow_mass_assignment_of(value)
        AllowMassAssignmentOfMatcher.new(value)
      end

      # The `allow_mass_assignment_of` matcher tests usage of Rails 3's
      # `attr_accessible` and `attr_protected` macros, asserting that
      # attributes can or cannot be mass-assigned on a record.
      #
      #     class Post
      #       include ActiveModel::Model
      #
      #       attr_accessible :title
      #     end
      #
      #     class User
      #       include ActiveModel::Model
      #
      #       attr_protected :encrypted_password
      #     end
      #
      #     # RSpec
      #     describe Post do
      #       it { should allow_mass_assignment_of(:title) }
      #     end
      #
      #     describe User do
      #       it { should_not allow_mass_assignment_of(:encrypted_password) }
      #     end
      #
      #     # Test::Unit
      #     class PostTest < ActiveSupport::TestCase
      #       should allow_mass_assignment_of(:title)
      #     end
      #
      #     class UserTest < ActiveSupport::TestCase
      #       should_not allow_mass_assignment_of(:encrypted_password)
      #     end
      #
      # ### Qualifiers
      #
      # * {#as}
      #
      def allow_mass_assignment_of(value)
        AllowMassAssignmentOfMatcher.new(value)
      end

      class AllowMassAssignmentOfMatcher
        # Makes a new instance of AllowMassAssignmentOfMatcher for a particular
        # attribute.
        #
        def initialize(attribute)
          @attribute = attribute.to_s
          @options = {}
        end

        # @private
        attr_reader :failure_message
        alias failure_message_for_should failure_message

        # @private
        attr_reader :failure_message_when_negated
        alias failure_message_for_should_not failure_message_when_negated

        # Scopes the matcher to a certain role. Used along with `:as`.
        #
        # Only works if you are using Rails >= 3.1.
        #
        # ## Example
        #
        #     class Post
        #       include ActiveModel::Model
        #
        #       attr_accessible :title, as: :admin
        #     end
        #
        #     # RSpec
        #     describe Post do
        #       it { should allow_mass_assignment_of(:title).as(:admin) }
        #     end
        #
        #     # Test::Unit
        #     class PostTest < ActiveSupport::TestCase
        #       should allow_mass_assignment_of(:title).as(:admin)
        #     end
        #
        # @return AllowMassAssignmentOfMatcher
        #
        def as(role)
          if active_model_less_than_3_1?
            raise 'You can specify role only in Rails 3.1 or greater'
          end
          @options[:role] = role
          self
        end

        # Given a record, passes if the attribute was placed in the attribute
        # whitelist (using `attr_accessible`) and the record allows the attribute
        # to be set.
        #
        def matches?(subject)
          @subject = subject
          if attr_mass_assignable?
            if whitelisting?
              @failure_message_when_negated = "#{@attribute} was made accessible"
            else
              if protected_attributes.empty?
                @failure_message_when_negated = 'no attributes were protected'
              else
                @failure_message_when_negated = "#{class_name} is protecting " <<
                  "#{protected_attributes.to_a.to_sentence}, " <<
                  "but not #{@attribute}."
              end
            end
            true
          else
            if whitelisting?
              @failure_message = "Expected #{@attribute} to be accessible"
            else
              @failure_message = "Did not expect #{@attribute} to be protected"
            end
            false
          end
        end

        # @private
        def description
          [base_description, role_description].compact.join(' ')
        end

        private

        def base_description
          "allow mass assignment of #{@attribute}"
        end

        def role_description
          if role != :default
            "as #{role}"
          end
        end

        def role
          @options[:role] || :default
        end

        def protected_attributes
          @protected_attributes ||= (@subject.class.protected_attributes || [])
        end

        def accessible_attributes
          @accessible_attributes ||= (@subject.class.accessible_attributes || [])
        end

        def whitelisting?
          authorizer.kind_of?(::ActiveModel::MassAssignmentSecurity::WhiteList)
        end

        def attr_mass_assignable?
          !authorizer.deny?(@attribute)
        end

        def authorizer
          if active_model_less_than_3_1?
            @subject.class.active_authorizer
          else
            @subject.class.active_authorizer[role]
          end
        end

        def class_name
          @subject.class.name
        end

        def active_model_less_than_3_1?
          ::ActiveModel::VERSION::STRING.to_f < 3.1
        end
      end
    end
  end
end
